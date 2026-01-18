/**
 * AST → JS Source String (codegen)
 *
 * Simple recursive stringifier using pattern matching on AST structure.
 */

// Operator-specific overrides
export const generators = {};

// Register custom generator
export const generator = (op, fn) => generators[op] = fn;

// Stringify AST to JS source
export const codegen = node => {
  // Handle undefined/null
  if (node === undefined) return 'undefined';
  if (node === null) return 'null';
  if (node === '') return '';

  // Identifier
  if (!Array.isArray(node)) return String(node);

  const [op, ...args] = node;

  // Literal: [, value]
  if (op === undefined) return typeof args[0] === 'string' ? JSON.stringify(args[0]) : String(args[0]);

  // Custom generator
  if (generators[op]) return generators[op](...args);

  // Brackets: [], {}, ()
  if (op === '[]' || op === '{}' || op === '()') {
    const prefix = args.length > 1 ? codegen(args.shift()) : '';
    // Empty brackets
    if (args[0] === undefined || args[0] === null) return prefix + op;
    // Comma sequence: [',', a, b, c] → a, b, c  (null → empty for sparse arrays)
    const inner = args[0]?.[0] === ','
      ? args[0].slice(1).map(a => a === null ? '' : codegen(a)).join(', ')
      : codegen(args[0]);
    return prefix + op[0] + inner + op[1];
  }

  // Unary: [op, a]
  if (args.length === 1) return op + codegen(args[0]);

  // N-ary/sequence: comma, semicolon
  if (op === ',' || op === ';') return args.filter(Boolean).map(codegen).join(op === ';' ? '; ' : ', ');

  // Binary: [op, a, b]
  if (args.length === 2) {
    const [a, b] = args;
    // Postfix: [op, a, null]
    if (b === null) return codegen(a) + op;
    // Property access: no spaces
    if (op === '.') return codegen(a) + '.' + b;
    return codegen(a) + ' ' + op + ' ' + codegen(b);
  }

  // Ternary: a ? b : c
  if (op === '?' && args.length === 3) {
    return codegen(args[0]) + ' ? ' + codegen(args[1]) + ' : ' + codegen(args[2]);
  }

  // Fallback n-ary
  return args.filter(Boolean).map(codegen).join(op === ';' ? '; ' : ', ');
};

// --- Statement generators (need structure) ---

// Variables: ['let', decl] or ['let', decl1, decl2, ...]
const varGen = kw => (...args) => kw + ' ' + args.map(codegen).join(', ');
generator('let', varGen('let'));
generator('const', varGen('const'));
generator('var', varGen('var'));

// Control flow
const wrap = s => '{ ' + (s ? codegen(s) : '') + ' }';
generator('if', (cond, then, els) => 'if (' + codegen(cond) + ') ' + wrap(then) + (els ? ' else ' + wrap(els) : ''));
generator('while', (cond, body) => 'while (' + codegen(cond) + ') ' + wrap(body));
generator('do', (body, cond) => 'do ' + wrap(body) + ' while (' + codegen(cond) + ')');
generator('for', (head, body) => {
  if (head?.[0] === ';') {
    const [, init, cond, step] = head;
    return 'for (' + (init ? codegen(init) : '') + '; ' + (cond ? codegen(cond) : '') + '; ' + (step ? codegen(step) : '') + ') ' + wrap(body);
  }
  return 'for (' + codegen(head) + ') ' + wrap(body);
});

generator('return', a => a === undefined ? 'return' : 'return ' + codegen(a));
generator('break', () => 'break');
generator('continue', () => 'continue');
generator('throw', a => 'throw ' + codegen(a));

// Try/Catch - nested structure
generator('try', body => 'try { ' + codegen(body) + ' }');
generator('catch', (tryExpr, param, body) => codegen(tryExpr) + ' catch (' + codegen(param) + ') { ' + codegen(body) + ' }');
generator('finally', (expr, body) => codegen(expr) + ' finally { ' + codegen(body) + ' }');

// Functions
generator('function', (name, params, body) => {
  const args = !params ? '' : params[0] === ',' ? params.slice(1).map(codegen).join(', ') : codegen(params);
  return 'function' + (name ? ' ' + name : '') + '(' + args + ') ' + wrap(body);
});

generator('=>', (params, body) => {
  if (params?.[0] === '()') params = params[1];
  const args = !params ? '()' : typeof params === 'string' ? params :
    params[0] === ',' ? '(' + params.slice(1).map(codegen).join(', ') + ')' : '(' + codegen(params) + ')';
  return args + ' => ' + codegen(body);
});

// Class
generator('class', (name, base, body) =>
  'class' + (name ? ' ' + name : '') + (base ? ' extends ' + codegen(base) : '') + ' { ' + (body ? codegen(body) : '') + ' }');

// Async/Await/Yield
generator('async', fn => 'async ' + codegen(fn));
generator('await', a => 'await ' + codegen(a));
generator('yield', a => a !== undefined ? 'yield ' + codegen(a) : 'yield');
generator('yield*', a => 'yield* ' + codegen(a));

// Switch
generator('switch', (expr, body) => 'switch (' + codegen(expr) + ') ' + codegen(body));
generator('case', (test, body) => 'case ' + codegen(test) + ':' + (body ? ' ' + codegen(body) : ''));
generator('default:', body => 'default:' + (body ? ' ' + codegen(body) : ''));

// Keywords
generator('typeof', a => '(typeof ' + codegen(a) + ')');
generator('void', a => '(void ' + codegen(a) + ')');
generator('delete', a => '(delete ' + codegen(a) + ')');
generator('new', a => 'new ' + codegen(a));
generator('instanceof', (a, b) => '(' + codegen(a) + ' instanceof ' + codegen(b) + ')');

// Optional chaining
generator('?.', (a, b) => codegen(a) + '?.' + b);
generator('?.[]', (a, b) => codegen(a) + '?.[' + codegen(b) + ']');
generator('?.()', (a, b) => codegen(a) + '?.(' + (!b ? '' : b[0] === ',' ? b.slice(1).map(codegen).join(', ') : codegen(b)) + ')');

// Object literal
generator(':', (k, v) => (typeof k === 'string' ? k : '[' + codegen(k) + ']') + ': ' + codegen(v));

// Template literals
generator('`', (...parts) => '`' + parts.map(p => p?.[0] === undefined ? String(p[1]).replace(/`/g, '\\`').replace(/\$/g, '\\$') : '${' + codegen(p) + '}').join('') + '`');
generator('``', (tag, ...parts) => codegen(tag) + '`' + parts.map(p => p?.[0] === undefined ? String(p[1]).replace(/`/g, '\\`').replace(/\$/g, '\\$') : '${' + codegen(p) + '}').join('') + '`');

// Getter/Setter
generator('get', (name, body) => 'get ' + name + '() { ' + (body ? codegen(body) : '') + ' }');
generator('set', (name, param, body) => 'set ' + name + '(' + param + ') { ' + (body ? codegen(body) : '') + ' }');
generator('static', a => 'static ' + codegen(a));

// Non-JS operators (emit as helpers)
generator('..', (a, b) => 'range(' + codegen(a) + ', ' + codegen(b) + ')');
generator('..<', (a, b) => 'range(' + codegen(a) + ', ' + codegen(b) + ', true)');
generator('as', (a, b) => b ? codegen(a) + ' as ' + b : codegen(a));  // import alias or type assertion
generator('is', (a, b) => '(' + codegen(a) + ' instanceof ' + codegen(b) + ')');
generator('defer', a => '/* defer */ ' + codegen(a));

// For-in/of helper
generator('in', (a, b) => codegen(a) + ' in ' + codegen(b));
generator('of', (a, b) => codegen(a) + ' of ' + codegen(b));
generator('for await', (head, body) => 'for await (' + codegen(head) + ') ' + wrap(body));

// Module syntax
generator('export', spec => 'export ' + codegen(spec));
generator('import', spec => 'import ' + codegen(spec));
generator('from', (what, path) => codegen(what) + ' from ' + codegen(path));
generator('default', a => 'default ' + codegen(a));

export default codegen;
