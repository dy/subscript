/**
 * ESM Bundler using subscript's own parser (dogfooding)
 *
 * Thin layer: scope analysis + tree transform
 * Parser comes from the dialect (jessie by default)
 */
import { parse } from '../parse/jessie.js';
import { codegen } from '../compile/js-emit.js';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

// === AST Utilities ===

/** Walk AST, call fn(node, parent, key) for each node */
const walk = (node, fn, parent = null, key = null) => {
  if (!node || typeof node !== 'object') return;
  fn(node, parent, key);
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) walk(node[i], fn, node, i);
  }
};

/** Deep clone AST */
const clone = node =>
  !node ? node :
  Array.isArray(node) ? node.map(clone) :
  node instanceof RegExp ? new RegExp(node.source, node.flags) :
  typeof node === 'object' ? Object.fromEntries(Object.entries(node).map(([k,v]) => [k, clone(v)])) :
  node;

/** Rename identifier in AST - skip property access positions */
const renameId = (ast, old, neu) => {
  walk(ast, (node, parent, key) => {
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        if (node[i] === old) {
          // Don't rename if this is a property name in a '.' or '?.' access
          if ((node[0] === '.' || node[0] === '?.') && i === 2) continue;
          // Don't rename if this is a property name in object literal {a: b} or shorthand {a}
          if (node[0] === ':' && i === 1 && typeof node[1] === 'string') continue;
          node[i] = neu;
        }
      }
    }
  });
  return ast;
};

/** Flatten comma nodes into array: [',', 'a', 'b'] → ['a', 'b'], 'x' → ['x'] */
const flattenComma = node =>
  Array.isArray(node) && node[0] === ',' ? node.slice(1) :
  node ? [node] : [];

// === Module Analysis ===

/** Extract string from path node [null, 'path'] (string literal) */
const getPath = node => Array.isArray(node) && (node[0] === undefined || node[0] === null) ? node[1] : node;

/** Extract imports from AST
 * New AST shapes:
 *   import './x.js'           → ['import', [null, path]]
 *   import X from './x.js'    → ['import', ['from', 'X', [null, path]]]
 *   import {a,b} from './x'   → ['import', ['from', ['{}', ...], [null, path]]]
 *   import * as X from './x'  → ['import', ['from', ['as', '*', 'X'], [null, path]]]
 */
const getImports = ast => {
  const imports = [];
  walk(ast, node => {
    if (!Array.isArray(node) || node[0] !== 'import') return;
    const body = node[1];
    const imp = { node };

    // import './x.js' - bare import: [, 'path'] sparse array with undefined at index 0
    if (Array.isArray(body) && (body[0] === undefined || body[0] === null)) {
      imp.path = body[1];
      imports.push(imp);
      return;
    }

    // import X from './x.js' or import {...} from './x.js'
    if (Array.isArray(body) && body[0] === 'from') {
      const spec = body[1];
      const pathNode = body[2];
      imp.path = getPath(pathNode);

      if (typeof spec === 'string') {
        // import X from - default import
        imp.default_ = spec;
      } else if (Array.isArray(spec)) {
        if (spec[0] === '{}') {
          // import { a, b, c as d }
          const items = spec.slice(1).flatMap(flattenComma);
          imp.named = items.map(s =>
            Array.isArray(s) && s[0] === 'as' ? { name: s[1], alias: s[2] } : { name: s, alias: s }
          );
        } else if (spec[0] === 'as' && spec[1] === '*') {
          // import * as X
          imp.namespace = spec[2];
        } else if (spec[0] === '*') {
          // import * as X (alternate shape)
          imp.namespace = spec[1];
        }
      }
      imports.push(imp);
    }
  });
  return imports;
};

/** Extract exports from AST
 * New AST shapes:
 *   export const x = 1        → ['export', ['const', ['=', 'x', val]]]
 *   export default x          → ['export', ['default', 'x']]
 *   export { a }              → ['export', ['{}', 'a']]
 *   export { a } from './x'   → ['export', ['from', ['{}', 'a'], [null, path]]]
 *   export * from './x'       → ['export', ['from', '*', [null, path]]]
 */
const getExports = ast => {
  const exports = { named: {}, reexports: [], default_: null };

  walk(ast, node => {
    if (!Array.isArray(node) || node[0] !== 'export') return;
    const spec = node[1];

    // export { a } from './x' or export * from './x'
    if (Array.isArray(spec) && spec[0] === 'from') {
      const what = spec[1];
      const pathNode = spec[2];
      const path = getPath(pathNode);

      if (what === '*') {
        exports.reexports.push({ star: true, path });
      } else if (Array.isArray(what) && what[0] === '{}') {
        const items = what.slice(1).flatMap(flattenComma);
        const names = items.map(s =>
          Array.isArray(s) && s[0] === 'as' ? { name: s[1], alias: s[2] } : { name: s, alias: s }
        );
        exports.reexports.push({ names, path });
      }
      return;
    }

    // export { a, b }
    if (Array.isArray(spec) && spec[0] === '{}') {
      const items = spec.slice(1).flatMap(flattenComma);
      const names = items.map(s =>
        Array.isArray(s) && s[0] === 'as' ? { name: s[1], alias: s[2] } : { name: s, alias: s }
      );
      for (const { name, alias } of names) exports.named[alias] = name;
      return;
    }

    // export default x
    if (Array.isArray(spec) && spec[0] === 'default') {
      exports.default_ = spec[1];
      return;
    }

    // export const/let/var x = ... - varargs: ['let', decl1, decl2, ...]
    if (Array.isArray(spec) && (spec[0] === 'const' || spec[0] === 'let' || spec[0] === 'var')) {
      for (let i = 1; i < spec.length; i++) {
        const decl = spec[i];
        if (typeof decl === 'string') {
          exports.named[decl] = decl;
        } else if (Array.isArray(decl) && decl[0] === '=') {
          const name = decl[1];
          if (typeof name === 'string') exports.named[name] = name;
        }
      }
      return;
    }

    // export function x() {} or export class x {}
    if (Array.isArray(spec) && (spec[0] === 'function' || spec[0] === 'class')) {
      if (typeof spec[1] === 'string') exports.named[spec[1]] = spec[1];
    }
  });

  return exports;
};

/** Get all declared names in AST
 * New AST shapes:
 *   const x = 1   → ['const', ['=', 'x', val]]
 *   let x         → ['let', 'x']
 *   function f()  → ['function', 'f', ...]
 *   const a = 1, b = 2 → ['const', ['=', 'a', ...], ['=', 'b', ...]] (varargs)
 */
const getDecls = ast => {
  const decls = new Set();

  const addDecl = node => {
    if (typeof node === 'string') decls.add(node);
    else if (Array.isArray(node)) {
      if (node[0] === '=') {
        if (typeof node[1] === 'string') decls.add(node[1]);
      } else if (node[0] === ',') {
        // Multiple declarations: const a = 1, b = 2 (older AST shape)
        for (let i = 1; i < node.length; i++) addDecl(node[i]);
      }
    }
  };

  walk(ast, node => {
    if (!Array.isArray(node)) return;
    const op = node[0];

    if (op === 'const' || op === 'let' || op === 'var') {
      // Handle varargs: ['const', decl1, decl2, ...] for multiple declarations
      for (let i = 1; i < node.length; i++) addDecl(node[i]);
    }
    if (op === 'function' || op === 'class') {
      if (typeof node[1] === 'string') decls.add(node[1]);
    }
    if (op === 'export') {
      const spec = node[1];
      if (Array.isArray(spec) && (spec[0] === 'const' || spec[0] === 'let' || spec[0] === 'var')) {
        addDecl(spec[1]);
      }
      if (Array.isArray(spec) && (spec[0] === 'function' || spec[0] === 'class') && typeof spec[1] === 'string') {
        decls.add(spec[1]);
      }
    }
  });

  return decls;
};

// === AST Transforms ===

/** Remove import/export nodes, extract declarations */
/** Remove import/export nodes, extract declarations
 * New AST shapes for export:
 *   export const x = 1      → ['export', ['const', ...]] → keep ['const', ...]
 *   export default x        → ['export', ['default', x]] → keep, or convert to __default
 *   export { a }            → ['export', ['{}', ...]] → remove
 *   export { a } from './x' → ['export', ['from', ['{}', ...], path]] → remove
 *   export * from './x'     → ['export', ['from', '*', path]] → remove
 */
const stripModuleSyntax = ast => {
  const defaultExpr = { value: null };

  const process = node => {
    if (!Array.isArray(node)) return node;
    const op = node[0];

    if (op === 'import') return null;

    if (op === 'export') {
      const spec = node[1];
      // Re-exports: export { a } from './x' or export * from './x'
      if (Array.isArray(spec) && spec[0] === 'from') return null;
      // Named exports: export { a, b }
      if (Array.isArray(spec) && spec[0] === '{}') return null;
      // Default export
      if (Array.isArray(spec) && spec[0] === 'default') {
        defaultExpr.value = spec[1];
        if (typeof spec[1] === 'string') return null;
        return ['const', ['=', '__default', spec[1]]];
      }
      // Declaration export: export const x = 1
      return spec;
    }

    if (op === ';') {
      const parts = node.slice(1).map(process).filter(Boolean);
      if (parts.length === 0) return null;
      if (parts.length === 1) return parts[0];
      return [';', ...parts];
    }

    return node;
  };

  return { ast: process(ast), defaultExpr: defaultExpr.value };
};

// === Path Resolution ===

const resolvePath = (from, to) => {
  if (!to.startsWith('.')) return to;
  const base = from.split('/').slice(0, -1);
  for (const part of to.split('/')) {
    if (part === '..') base.pop();
    else if (part !== '.') base.push(part);
  }
  let path = base.join('/');
  if (!path.endsWith('.js')) path += '.js';
  return path;
};

// === Bundler ===

/**
 * Bundle ES modules into single file
 * @param {string} entry - Entry file path
 * @param {(path: string) => string|Promise<string>} read - File reader
 */
export async function bundle(entry, read) {
  const modules = new Map();
  const order = [];

  async function load(path) {
    if (modules.has(path)) return;
    modules.set(path, null);

    const code = await read(path);
    const ast = parse(code);
    const imports = getImports(ast);
    const exports = getExports(ast);
    const decls = getDecls(ast);

    for (const imp of imports) {
      imp.resolved = resolvePath(path, imp.path);
      await load(imp.resolved);
    }
    for (const re of exports.reexports) {
      re.resolved = resolvePath(path, re.path);
      await load(re.resolved);
    }

    modules.set(path, { ast: clone(ast), imports, exports, decls });
    order.push(path);
  }

  await load(entry);

  // Detect conflicts
  const allDecls = new Map();
  for (const [path, mod] of modules) {
    const importAliases = new Set();
    for (const imp of mod.imports) {
      if (imp.default_) importAliases.add(imp.default_);
      if (imp.namespace) importAliases.add(imp.namespace);
      if (imp.named) for (const { alias } of imp.named) importAliases.add(alias);
    }

    for (const name of mod.decls) {
      if (importAliases.has(name)) continue;
      if (!allDecls.has(name)) allDecls.set(name, []);
      allDecls.get(name).push(path);
    }
  }

  // Build rename maps
  const renames = new Map();
  for (const [name, paths] of allDecls) {
    if (paths.length > 1) {
      for (const path of paths) {
        if (!renames.has(path)) renames.set(path, {});
        // Make valid JS identifier: replace non-alphanumeric with underscore
        const prefix = path.split('/').pop().replace('.js', '').replace(/[^a-zA-Z0-9]/g, '_') + '_';
        renames.get(path)[name] = prefix + name;
      }
    }
  }

  const traceDefault = path => {
    const mod = modules.get(path);
    if (!mod) return null;
    const def = mod.exports.default_;
    if (!def) return null;
    if (typeof def === 'string') {
      const pathRenames = renames.get(path) || {};
      if (pathRenames[def]) return pathRenames[def];
      const defImp = mod.imports.find(i => i.default_ === def);
      if (defImp) return traceDefault(defImp.resolved);
      return def;
    }
    return '__default';
  };

  // Transform each module
  const chunks = [];
  for (const path of order) {
    const mod = modules.get(path);
    const pathRenames = renames.get(path) || {};

    let ast = clone(mod.ast);
    for (const [old, neu] of Object.entries(pathRenames)) {
      renameId(ast, old, neu);
    }

    for (const imp of mod.imports) {
      const dep = modules.get(imp.resolved);
      if (!dep) continue;
      const depRenames = renames.get(imp.resolved) || {};

      if (imp.named) {
        for (const { name, alias } of imp.named) {
          // `name` is the exported name, look up what local name it maps to in the dep
          const localName = dep.exports.named[name] || name;
          // Check if that local name was renamed in the dep
          const resolved = depRenames[localName] || localName;
          if (alias !== resolved) renameId(ast, alias, resolved);
        }
      }

      if (imp.default_) {
        const resolved = traceDefault(imp.resolved);
        if (resolved && imp.default_ !== resolved) {
          renameId(ast, imp.default_, resolved);
        }
      }

      if (imp.namespace) {
        walk(ast, node => {
          if (Array.isArray(node) && node[0] === '.' && node[1] === imp.namespace) {
            const prop = node[2];
            if (typeof prop === 'string' && dep.exports.named[prop]) {
              const resolved = depRenames[dep.exports.named[prop]] || dep.exports.named[prop];
              node.length = 0;
              node.push(resolved);
            }
          }
        });
      }
    }

    const { ast: stripped } = stripModuleSyntax(ast);

    if (stripped) {
      const code = codegen(stripped);
      if (code.trim()) {
        chunks.push(`// === ${path} ===\n${code}`);
      }
    }
  }

  // Generate exports
  const entryMod = modules.get(entry);
  const entryRenames = renames.get(entry) || {};
  const exportLines = [];

  for (const [exp, local] of Object.entries(entryMod.exports.named)) {
    const resolved = entryRenames[local] || local;
    exportLines.push(exp === resolved ? exp : `${resolved} as ${exp}`);
  }

  for (const re of entryMod.exports.reexports) {
    if (re.star) continue;
    const depRenames = renames.get(re.resolved) || {};
    for (const { name, alias } of re.names) {
      const resolved = depRenames[name] || name;
      exportLines.push(alias === resolved ? alias : `${resolved} as ${alias}`);
    }
  }

  if (entryMod.exports.default_) {
    const resolved = traceDefault(entry) || '__default';
    exportLines.push(`${resolved} as default`);
  }

  let result = chunks.join('\n\n');
  if (exportLines.length) {
    result += `\n\nexport { ${exportLines.join(', ')} }`;
  }

  return result;
}

/** Bundle with Node.js fs */
export const bundleFile = (entry) => bundle(resolve(entry), path => readFile(path, 'utf-8'));

// CLI
if (typeof process !== 'undefined' && process.argv[1]?.includes('bundle')) {
  const entry = process.argv[2];
  if (!entry) {
    console.error('Usage: node bundle.js <entry>');
    process.exit(1);
  }
  bundleFile(entry)
    .then(result => console.log(result))
    .catch(e => {
      console.error('Error:', e.message);
      console.error(e.stack);
      process.exit(1);
    });
}
