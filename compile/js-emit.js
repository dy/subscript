/**
 * JS Emit: AST → JS Source String
 * Generates JavaScript source code from AST.
 *
 * Output can be used with eval() or new Function().
 * For direct closure-based evaluation, use js.js instead.
 *
 * Naming: {target}-emit.js for source generators
 * e.g. js-emit.js, c-emit.js, wat-emit.js
 */

// Code generator registry
export const generators = {};

// Register a code generator
export const generator = (op, fn, prev = generators[op]) =>
  (generators[op] = (...args) => fn(...args) ?? prev?.(...args));

// Generate JS source from AST
// - string → identifier (variable name)
// - [, value] → literal (number, string, boolean, null)
// - [op, ...args] → operator application
export const codegen = node =>
  !Array.isArray(node) ? (node === undefined ? 'undefined' : node) : // identifier
  node[0] === undefined ? (typeof node[1] === 'string' ? JSON.stringify(node[1]) : String(node[1])) : // literal
  generators[node[0]]?.(...node.slice(1)) ?? err(`Unknown operator: ${node[0]}`);

const err = (msg = 'Compile error') => { throw Error(msg) };

// --- Basic operators ---

// Arithmetic
generator('+', (a, b) => b !== undefined ? `(${codegen(a)} + ${codegen(b)})` : `(+${codegen(a)})`);
generator('-', (a, b) => b !== undefined ? `(${codegen(a)} - ${codegen(b)})` : `(-${codegen(a)})`);
generator('*', (a, b) => b !== undefined && `(${codegen(a)} * ${codegen(b)})`);
generator('/', (a, b) => b !== undefined && `(${codegen(a)} / ${codegen(b)})`);
generator('%', (a, b) => b !== undefined && `(${codegen(a)} % ${codegen(b)})`);
generator('**', (a, b) => `(${codegen(a)} ** ${codegen(b)})`);

// Increment/Decrement
generator('++', a => a !== undefined && `(++${codegen(a)})`);
generator('--', a => a !== undefined && `(--${codegen(a)})`);
generator('+++', a => `(${codegen(a)}++)`); // postfix
generator('---', a => `(${codegen(a)}--)`); // postfix;

// Comparison
generator('==', (a, b) => `(${codegen(a)} == ${codegen(b)})`);
generator('!=', (a, b) => `(${codegen(a)} != ${codegen(b)})`);
generator('===', (a, b) => `(${codegen(a)} === ${codegen(b)})`);
generator('!==', (a, b) => `(${codegen(a)} !== ${codegen(b)})`);
generator('>', (a, b) => `(${codegen(a)} > ${codegen(b)})`);
generator('<', (a, b) => `(${codegen(a)} < ${codegen(b)})`);
generator('>=', (a, b) => `(${codegen(a)} >= ${codegen(b)})`);
generator('<=', (a, b) => `(${codegen(a)} <= ${codegen(b)})`);

// Logical
generator('||', (a, b) => `(${codegen(a)} || ${codegen(b)})`);
generator('&&', (a, b) => `(${codegen(a)} && ${codegen(b)})`);
generator('!', a => `(!${codegen(a)})`);
generator('??', (a, b) => `(${codegen(a)} ?? ${codegen(b)})`);

// Bitwise
generator('|', (a, b) => `(${codegen(a)} | ${codegen(b)})`);
generator('&', (a, b) => `(${codegen(a)} & ${codegen(b)})`);
generator('^', (a, b) => `(${codegen(a)} ^ ${codegen(b)})`);
generator('~', a => `(~${codegen(a)})`);
generator('<<', (a, b) => `(${codegen(a)} << ${codegen(b)})`);
generator('>>', (a, b) => `(${codegen(a)} >> ${codegen(b)})`);
generator('>>>', (a, b) => `(${codegen(a)} >>> ${codegen(b)})`);

// Member access
generator('.', (a, b) => `${codegen(a)}.${b}`);
generator('[]', (a, b) => b === undefined
  ? `[${!a ? '' : a[0] === ',' ? a.slice(1).map(codegen).join(', ') : codegen(a)}]`
  : `${codegen(a)}[${codegen(b)}]`);

// Optional chaining
generator('?.', (a, b) => `${codegen(a)}?.${b}`);
generator('?.[]', (a, b) => `${codegen(a)}?.[${codegen(b)}]`);
generator('?.()', (a, b) => `${codegen(a)}?.(${!b ? '' : b[0] === ',' ? b.slice(1).map(codegen).join(', ') : codegen(b)})`);

// In/Of operators (for for-in/of loops)
generator('in', (a, b) => `${codegen(a)} in ${codegen(b)}`);
generator('of', (a, b) => `${codegen(a)} of ${codegen(b)}`);

// Group/Call
generator('()', (a, b) => b === undefined
  ? `(${codegen(a)})`
  : `${codegen(a)}(${!b ? '' : b[0] === ',' ? b.slice(1).map(codegen).join(', ') : codegen(b)})`);

// Ternary
generator('?', (a, b, c) => `(${codegen(a)} ? ${codegen(b)} : ${codegen(c)})`);

// Assignment (simple - full impl would need lvalue handling)
generator('=', (a, b) => `${typeof a === 'string' ? a : codegen(a)} = ${codegen(b)}`);

// Compound assignment
generator('+=', (a, b) => `${typeof a === 'string' ? a : codegen(a)} += ${codegen(b)}`);
generator('-=', (a, b) => `${typeof a === 'string' ? a : codegen(a)} -= ${codegen(b)}`);
generator('*=', (a, b) => `${typeof a === 'string' ? a : codegen(a)} *= ${codegen(b)}`);
generator('/=', (a, b) => `${typeof a === 'string' ? a : codegen(a)} /= ${codegen(b)}`);
generator('%=', (a, b) => `${typeof a === 'string' ? a : codegen(a)} %= ${codegen(b)}`);
generator('**=', (a, b) => `${typeof a === 'string' ? a : codegen(a)} **= ${codegen(b)}`);
generator('|=', (a, b) => `${typeof a === 'string' ? a : codegen(a)} |= ${codegen(b)}`);
generator('&=', (a, b) => `${typeof a === 'string' ? a : codegen(a)} &= ${codegen(b)}`);
generator('^=', (a, b) => `${typeof a === 'string' ? a : codegen(a)} ^= ${codegen(b)}`);
generator('<<=', (a, b) => `${typeof a === 'string' ? a : codegen(a)} <<= ${codegen(b)}`);
generator('>>=', (a, b) => `${typeof a === 'string' ? a : codegen(a)} >>= ${codegen(b)}`);
generator('>>>=', (a, b) => `${typeof a === 'string' ? a : codegen(a)} >>>= ${codegen(b)}`);
generator('||=', (a, b) => `${typeof a === 'string' ? a : codegen(a)} ||= ${codegen(b)}`);
generator('&&=', (a, b) => `${typeof a === 'string' ? a : codegen(a)} &&= ${codegen(b)}`);
generator('??=', (a, b) => `${typeof a === 'string' ? a : codegen(a)} ??= ${codegen(b)}`);

// Object literal
generator('{}', a => {
  if (!a) return '{}';
  const props = a[0] === ',' ? a.slice(1) : [a];
  return `{${props.map(p => {
    if (typeof p === 'string') return p; // shorthand
    if (p[0] === ':') return `${typeof p[1] === 'string' ? p[1] : `[${codegen(p[1])}]`}: ${codegen(p[2])}`;
    return codegen(p);
  }).join(', ')}}`;
});

// Sequence
generator(',', (...args) => args.map(codegen).join(', '));
generator(';', (...args) => args.map(codegen).join('; '));

// Block
generator('block', body => body === undefined ? '{}' : `{ ${codegen(body)} }`);

// Variables - new format: ["let", body] where body is ['=', name, val] or name or [',', decl1, decl2, ...]
const varGen = keyword => (...args) => {
  // Handle: ['let', ['=', name, val]]
  // Or: ['let', name]
  // Or: ['let', decl1, decl2, ...] for multiple declarations
  if (args.length === 1) {
    const body = args[0];
    if (typeof body === 'string') return `${keyword} ${body}`;
    if (Array.isArray(body) && body[0] === '=') {
      return `${keyword} ${codegen(body)}`;
    }
    if (Array.isArray(body) && body[0] === ',') {
      return `${keyword} ${body.slice(1).map(codegen).join(', ')}`;
    }
    return `${keyword} ${codegen(body)}`;
  }
  // Multiple args: ['let', decl1, decl2, ...]
  return `${keyword} ${args.map(codegen).join(', ')}`;
};
generator('let', varGen('let'));
generator('const', varGen('const'));
generator('var', varGen('var'));

// Wrap statement in braces if not already a block
const wrapStmt = s => s?.[0] === 'block' ? codegen(s) : `{ ${s !== undefined ? codegen(s) : ''} }`;

// Control flow
generator('if', (cond, then, els) => els
  ? `if (${codegen(cond)}) ${wrapStmt(then)} else ${wrapStmt(els)}`
  : `if (${codegen(cond)}) ${wrapStmt(then)}`);

generator('while', (cond, body) => `while (${codegen(cond)}) ${wrapStmt(body)}`);

generator('do', (body, cond) => `do ${wrapStmt(body)} while (${codegen(cond)})`);

generator('for', (head, body) => {
  // Normalize head: [';', init, cond, step] or single expr (for-in/of)
  if (Array.isArray(head) && head[0] === ';') {
    const [, init, cond, step] = head;
    return `for (${init ? codegen(init) : ''}; ${cond ? codegen(cond) : ''}; ${step ? codegen(step) : ''}) ${wrapStmt(body)}`;
  }
  // For-in/of: head is ['in', lhs, rhs] or ['of', lhs, rhs]
  if (Array.isArray(head) && (head[0] === 'in' || head[0] === 'of')) {
    const [op, lhs, rhs] = head;
    return `for (${codegen(lhs)} ${op} ${codegen(rhs)}) ${wrapStmt(body)}`;
  }
  return `for (${codegen(head)}) ${wrapStmt(body)}`;
});

generator('return', a => a === undefined ? 'return' : `return ${codegen(a)}`);
generator('break', () => 'break');
generator('continue', () => 'continue');
generator('throw', a => `throw ${codegen(a)}`);

// Try/Catch/Finally
// AST: ['finally', ['catch', ['try', body], param, catchBody], finallyBody]
generator('try', body => `try { ${codegen(body)} }`);
generator('catch', (tryExpr, param, body) => `${codegen(tryExpr)} catch (${codegen(param)}) { ${codegen(body)} }`);
generator('finally', (expr, body) => `${codegen(expr)} finally { ${codegen(body)} }`);

// Switch
generator('switch', (expr, body) => `switch (${codegen(expr)}) ${codegen(body)}`);
generator('case', (test, body) => body !== undefined
  ? `case ${codegen(test)}: ${codegen(body)}`
  : `case ${codegen(test)}:`);
generator('default:', body => body !== undefined ? `default: ${codegen(body)}` : 'default:');

// Unary keyword operators
generator('typeof', a => `(typeof ${codegen(a)})`);
generator('void', a => `(void ${codegen(a)})`);
generator('delete', a => `(delete ${codegen(a)})`);
generator('instanceof', (a, b) => `(${codegen(a)} instanceof ${codegen(b)})`);
generator('new', a => `new ${codegen(a)}`);

// Spread/Rest
generator('...', a => `...${codegen(a)}`);

// Function
generator('function', (name, params, body) => {
  let args;
  if (!params) args = '';
  else if (typeof params === 'string') args = params;
  else if (params[0] === ',') args = params.slice(1).map(p => typeof p === 'string' ? p : codegen(p)).join(', ');
  else args = typeof params === 'string' ? params : codegen(params);
  // Wrap body in braces if not already a block
  const bodyCode = body?.[0] === 'block' ? codegen(body) : `{ ${body !== undefined ? codegen(body) : ''} }`;
  return name
    ? `function ${name}(${args}) ${bodyCode}`
    : `function(${args}) ${bodyCode}`;
});

generator('=>', (params, body) => {
  // Unwrap () grouping
  if (Array.isArray(params) && params[0] === '()') params = params[1];
  // Build args string
  let args;
  if (!params) args = '()';
  else if (typeof params === 'string') args = params;
  else if (params[0] === ',') args = `(${params.slice(1).map(p => typeof p === 'string' ? p : codegen(p)).join(', ')})`;
  else args = `(${typeof params === 'string' ? params : codegen(params)})`;
  const bod = body?.[0] === 'block' ? codegen(body) : codegen(body);
  return `${args} => ${bod}`;
});

// Async: ['async', fn] wraps fn as async
generator('async', fn => `async ${codegen(fn)}`);

// Await: ['await', expr]
generator('await', a => `await ${codegen(a)}`);

// Yield: ['yield', expr]
generator('yield', a => a !== undefined ? `yield ${codegen(a)}` : 'yield');
generator('yield*', a => `yield* ${codegen(a)}`);

// Static: ['static', member]
generator('static', a => `static ${codegen(a)}`);

// Defer: ['defer', expr] - not native JS, emit comment
generator('defer', a => `/* defer */ ${codegen(a)}`);

// Range operators - not native JS, emit as helper call
generator('..', (a, b) => `range(${codegen(a)}, ${codegen(b)})`);
generator('..<', (a, b) => `range(${codegen(a)}, ${codegen(b)}, true)`);

// Type operators
generator('as', (a, b) => codegen(a)); // JS has no type cast, identity
generator('is', (a, b) => `(${codegen(a)} instanceof ${codegen(b)})`);

// For await
generator('for await', (head, body) => {
  if (Array.isArray(head) && head[0] === 'of') {
    const [, lhs, rhs] = head;
    return `for await (${codegen(lhs)} of ${codegen(rhs)}) ${wrapStmt(body)}`;
  }
  return `for await (${codegen(head)}) ${wrapStmt(body)}`;
});

// Class: ['class', name, base, body]
generator('class', (name, base, body) => {
  let result = 'class';
  if (name) result += ` ${name}`;
  if (base) result += ` extends ${codegen(base)}`;
  result += ' { ';
  if (body) result += codegen(body);
  return result + ' }';
});

// Template literals
generator('`', (...parts) => {
  let result = '`';
  for (const p of parts) {
    if (Array.isArray(p) && p[0] === undefined) result += p[1].replace(/`/g, '\\`').replace(/\$/g, '\\$');
    else result += '${' + codegen(p) + '}';
  }
  return result + '`';
});

// Tagged templates
generator('``', (tag, ...parts) => {
  let result = codegen(tag) + '`';
  for (const p of parts) {
    if (Array.isArray(p) && p[0] === undefined) result += p[1].replace(/`/g, '\\`').replace(/\$/g, '\\$');
    else result += '${' + codegen(p) + '}';
  }
  return result + '`';
});

// Getter/Setter
// ['get', name, body] → get name() { body }
generator('get', (name, body) => `get ${name}() { ${body !== undefined ? codegen(body) : ''} }`);
// ['set', name, param, body] → set name(param) { body }
generator('set', (name, param, body) => `set ${name}(${param}) { ${body !== undefined ? codegen(body) : ''} }`);

export default codegen;
