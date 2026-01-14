/**
 * ESM Bundler using subscript's own parser (dogfooding)
 *
 * Thin layer: scope analysis + tree transform
 * Parser comes from the dialect (jessie by default)
 */
import { parse } from '../parse/jessie.js';
import { codegen } from '../compile/js-emit.js';

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
  typeof node === 'object' ? Object.fromEntries(Object.entries(node).map(([k,v]) => [k, clone(v)])) :
  node;

/** Rename identifier in AST */
const renameId = (ast, old, neu) => {
  walk(ast, node => {
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        if (node[i] === old) node[i] = neu;
      }
    }
  });
  return ast;
};

// === Module Analysis ===

/** Extract imports from AST */
const getImports = ast => {
  const imports = [];
  walk(ast, node => {
    if (!Array.isArray(node) || node[0] !== 'import') return;
    const imp = { path: node[1], node };

    if (node[2]) {
      const spec = node[2];
      if (spec[0] === '{}') {
        imp.named = spec.slice(1).map(s =>
          Array.isArray(s) && s[0] === 'as' ? { name: s[1], alias: s[2] } : { name: s, alias: s }
        );
      } else if (spec[0] === '*') {
        imp.namespace = spec[1];
      } else if (spec[0] === 'default') {
        imp.default_ = spec[1];
      }
      if (node[3]) {
        const spec2 = node[3];
        if (spec2[0] === '{}') {
          imp.named = spec2.slice(1).map(s =>
            Array.isArray(s) && s[0] === 'as' ? { name: s[1], alias: s[2] } : { name: s, alias: s }
          );
        }
      }
    }
    imports.push(imp);
  });
  return imports;
};

/** Extract exports from AST */
const getExports = ast => {
  const exports = { named: {}, reexports: [], default_: null };

  walk(ast, node => {
    if (!Array.isArray(node) || node[0] !== 'export') return;
    const spec = node[1];
    const path = node[2];

    if (spec[0] === '{}') {
      const names = spec.slice(1).map(s =>
        Array.isArray(s) && s[0] === 'as' ? { name: s[1], alias: s[2] } : { name: s, alias: s }
      );
      if (path) {
        exports.reexports.push({ names, path });
      } else {
        for (const { name, alias } of names) exports.named[alias] = name;
      }
    } else if (spec[0] === '*') {
      exports.reexports.push({ star: true, path });
    } else if (spec[0] === 'default') {
      exports.default_ = spec[1];
    } else if (spec[0] === 'const' || spec[0] === 'let' || spec[0] === 'var') {
      exports.named[spec[1]] = spec[1];
    } else if (spec[0] === 'function' || spec[0] === 'class') {
      exports.named[spec[1]] = spec[1];
    }
  });

  return exports;
};

/** Get all declared names in AST */
const getDecls = ast => {
  const decls = new Set();

  walk(ast, node => {
    if (!Array.isArray(node)) return;
    const op = node[0];

    if (op === 'const' || op === 'let' || op === 'var') {
      if (typeof node[1] === 'string') decls.add(node[1]);
    }
    if (op === 'function' || op === 'class') {
      if (typeof node[1] === 'string') decls.add(node[1]);
    }
    if (op === 'export') {
      const spec = node[1];
      if ((spec[0] === 'const' || spec[0] === 'let' || spec[0] === 'var' ||
           spec[0] === 'function' || spec[0] === 'class') && typeof spec[1] === 'string') {
        decls.add(spec[1]);
      }
    }
  });

  return decls;
};

// === AST Transforms ===

/** Remove import/export nodes, extract declarations */
const stripModuleSyntax = ast => {
  const defaultExpr = { value: null };

  const process = node => {
    if (!Array.isArray(node)) return node;
    const op = node[0];

    if (op === 'import') return null;

    if (op === 'export') {
      const spec = node[1];
      if (spec[0] === '{}' || spec[0] === '*') return null;
      if (spec[0] === 'default') {
        defaultExpr.value = spec[1];
        if (typeof spec[1] === 'string') return null;
        return ['const', '__default', spec[1]];
      }
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
        const prefix = path.split('/').pop().replace('.js', '_');
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
          const resolved = depRenames[name] || name;
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
export async function bundleFile(entry) {
  const { readFile } = await import('fs/promises');
  const { resolve } = await import('path');
  return bundle(resolve(entry), path => readFile(path, 'utf-8'));
}

// CLI
if (typeof process !== 'undefined' && process.argv[1]?.includes('bundle')) {
  const entry = process.argv[2];
  if (!entry) {
    console.error('Usage: node bundle.js <entry>');
    process.exit(1);
  }
  try {
    console.log(await bundleFile(entry));
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}
