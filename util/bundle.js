/**
 * Minimal ESM bundler - merges modules into single scope
 *
 * Handles:
 *   import { a, b } from './x'
 *   import * as X from './x'
 *   export const/let/function/class
 *   export { a, b }
 *
 * Does NOT handle:
 *   export default, dynamic import(), re-exports, circular deps
 */

const IMPORT_RE = /import\s*(?:{([^}]+)}|\*\s*as\s+(\w+))?\s*from\s*['"]([^'"]+)['"]/g
const IMPORT_SIDE_EFFECT_RE = /import\s*['"][^'"]+['"]/g
const EXPORT_DECL_RE = /export\s+(const|let|var|function|class)\s+(\w+)/g
const EXPORT_LIST_RE = /export\s*{([^}]+)}/g
const TOP_DECL_RE = /^(const|let|var)\s+(?:{([^}]+)}|(\w+))/gm
const FUNC_DECL_RE = /^(function|class)\s+(\w+)/gm

// Parse imports from code
const parseImports = code => [...code.matchAll(IMPORT_RE)].map(m => ({
  named: m[1]?.split(',').map(s => {
    const [name, alias] = s.split(/\s+as\s+/).map(x => x.trim())
    return { name, alias: alias || name }
  }).filter(x => x.name),
  namespace: m[2],
  path: m[3],
  full: m[0]
}))

// Parse exports from code
const parseExports = code => {
  const exports = {}
  for (const m of code.matchAll(EXPORT_DECL_RE)) exports[m[2]] = m[2]
  for (const m of code.matchAll(EXPORT_LIST_RE)) {
    for (const s of m[1].split(',')) {
      const [name, alias] = s.split(/\s+as\s+/).map(x => x.trim())
      exports[alias || name] = name
    }
  }
  return exports
}

// Parse top-level declarations (non-exported)
const parseDecls = code => {
  const decls = new Set()
  // Remove exports first to avoid double-counting
  const noExports = code.replace(/^export\s+/gm, '')
  for (const m of noExports.matchAll(TOP_DECL_RE)) {
    if (m[2]) m[2].split(',').forEach(s => {
      const name = s.split(':')[0].trim()
      if (name) decls.add(name)
    })
    if (m[3]) decls.add(m[3])
  }
  for (const m of noExports.matchAll(FUNC_DECL_RE)) decls.add(m[2])
  return decls
}

// Rename identifier throughout code (word boundary aware)
const rename = (code, oldName, newName) =>
  code.replace(new RegExp(`\\b${oldName}\\b`, 'g'), newName)

// Resolve relative path from base
const resolvePath = (from, to) => {
  if (!to.startsWith('.')) return to
  const base = from.split('/').slice(0, -1)
  for (const part of to.split('/')) {
    if (part === '..') base.pop()
    else if (part !== '.') base.push(part)
  }
  let path = base.join('/')
  if (!path.endsWith('.js')) path += '.js'
  return path
}

/**
 * Bundle ES modules into single file
 * @param {string} entry - Entry file path
 * @param {(path: string) => string|Promise<string>} read - File reader
 * @returns {Promise<string>} Bundled code
 */
export async function bundle(entry, read) {
  const modules = new Map()  // path → { code, imports, exports, decls }
  const order = []           // topological order

  // Load module and dependencies recursively
  async function load(path) {
    if (modules.has(path)) return
    modules.set(path, null) // mark loading

    const code = await read(path)
    const imports = parseImports(code)
    const exports = parseExports(code)
    const decls = parseDecls(code)

    // Load dependencies first
    for (const imp of imports) {
      const depPath = resolvePath(path, imp.path)
      imp.resolved = depPath
      await load(depPath)
    }

    modules.set(path, { code, imports, exports, decls })
    order.push(path)
  }

  await load(entry)

  // Collect all declarations, detect conflicts
  const allDecls = new Map()  // name → [paths]
  for (const [path, mod] of modules) {
    for (const name of [...Object.values(mod.exports), ...mod.decls]) {
      if (!allDecls.has(name)) allDecls.set(name, [])
      allDecls.get(name).push(path)
    }
  }

  // Generate rename map for conflicts
  const renames = new Map()  // path → { oldName → newName }
  for (const [name, paths] of allDecls) {
    if (paths.length > 1) {
      for (const path of paths) {
        if (!renames.has(path)) renames.set(path, {})
        // Use filename as prefix: feature/literal.js → literal_
        const prefix = path.split('/').pop().replace('.js', '_')
        renames.get(path)[name] = prefix + name
      }
    }
  }

  // Build import resolution map: what name to use for imported symbol
  const resolveImport = (fromPath, depPath, name) => {
    const depRenames = renames.get(depPath)
    return depRenames?.[name] || name
  }

  // Transform each module
  const chunks = []
  for (const path of order) {
    const mod = modules.get(path)
    let code = mod.code

    // Apply local renames
    const localRenames = renames.get(path) || {}
    for (const [old, neu] of Object.entries(localRenames)) {
      code = rename(code, old, neu)
    }

    // Replace namespace imports: import * as P from './x' → nothing (use P.x directly)
    // But we need to resolve P.foo to actual names
    for (const imp of mod.imports) {
      if (imp.namespace) {
        const dep = modules.get(imp.resolved)
        // Replace P.exportedName with resolved name
        for (const [exported, local] of Object.entries(dep.exports)) {
          const resolved = resolveImport(path, imp.resolved, local)
          code = code.replace(
            new RegExp(`\\b${imp.namespace}\\.${exported}\\b`, 'g'),
            resolved
          )
        }
      }

      // Replace named imports with resolved names
      if (imp.named) {
        for (const { name, alias } of imp.named) {
          const resolved = resolveImport(path, imp.resolved, name)
          if (alias !== resolved) {
            code = rename(code, alias, resolved)
          }
        }
      }
    }

    // Strip imports
    code = code.replace(IMPORT_RE, '')
    code = code.replace(IMPORT_SIDE_EFFECT_RE, '')

    // Strip export keywords (keep declarations)
    code = code.replace(/^export\s+(?=const|let|var|function|class)/gm, '')
    code = code.replace(EXPORT_LIST_RE, '')

    // Clean empty lines
    code = code.replace(/^\s*\n/gm, '')

    if (code.trim()) {
      chunks.push(`// === ${path} ===\n${code.trim()}`)
    }
  }

  // Entry exports become bundle exports
  const entryMod = modules.get(entry)
  const entryRenames = renames.get(entry) || {}
  const exportLines = Object.entries(entryMod.exports)
    .map(([exported, local]) => {
      const resolved = entryRenames[local] || local
      return exported === resolved ? exported : `${resolved} as ${exported}`
    })
    .join(', ')

  let result = chunks.join('\n\n')
  if (exportLines) {
    result += `\n\nexport { ${exportLines} }`
  }

  return result
}

/**
 * Bundle with Node.js fs
 * @param {string} entry - Entry file path
 * @returns {Promise<string>}
 */
export async function bundleFile(entry) {
  const { readFile } = await import('fs/promises')
  const { resolve, dirname } = await import('path')
  const base = dirname(resolve(entry))
  return bundle(
    resolve(entry),
    path => readFile(path, 'utf-8')
  )
}

/**
 * Bundle with fetch (browser)
 * @param {string} entry - Entry URL
 * @returns {Promise<string>}
 */
export async function bundleFetch(entry) {
  const base = new URL(entry, location.href)
  return bundle(
    base.href,
    async path => {
      const res = await fetch(path)
      if (!res.ok) throw new Error(`Failed to fetch ${path}`)
      return res.text()
    }
  )
}
