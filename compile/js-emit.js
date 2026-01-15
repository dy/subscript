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
generator('+', (a, b) => b !== undefined && `(${codegen(a)} + ${codegen(b)})`);
generator('-', (a, b) => b !== undefined ? `(${codegen(a)} - ${codegen(b)})` : `(-${codegen(a)})`);
generator('*', (a, b) => b !== undefined && `(${codegen(a)} * ${codegen(b)})`);
generator('/', (a, b) => b !== undefined && `(${codegen(a)} / ${codegen(b)})`);
generator('%', (a, b) => b !== undefined && `(${codegen(a)} % ${codegen(b)})`);

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

// Group/Call
generator('()', (a, b) => b === undefined
  ? `(${codegen(a)})`
  : `${codegen(a)}(${!b ? '' : b[0] === ',' ? b.slice(1).map(codegen).join(', ') : codegen(b)})`);

// Ternary
generator('?', (a, b, c) => `(${codegen(a)} ? ${codegen(b)} : ${codegen(c)})`);

// Assignment (simple - full impl would need lvalue handling)
generator('=', (a, b) => `${typeof a === 'string' ? a : codegen(a)} = ${codegen(b)}`);

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

// Variables - format: ["let", name, value] or ["let", name] for declaration without init
generator('let', (name, value) => value !== undefined ? `let ${name} = ${codegen(value)}` : `let ${name}`);
generator('const', (name, value) => value !== undefined ? `const ${name} = ${codegen(value)}` : `const ${name}`);
generator('var', (name, value) => value !== undefined ? `var ${name} = ${codegen(value)}` : `var ${name}`);

// Control flow
generator('if', (cond, then, els) => els
  ? `if (${codegen(cond)}) ${codegen(then)} else ${codegen(els)}`
  : `if (${codegen(cond)}) ${codegen(then)}`);

generator('while', (cond, body) => `while (${codegen(cond)}) ${codegen(body)}`);

generator('for', (head, body) => {
  // Normalize head: [';', init, cond, step] or single expr (for-in/of)
  if (Array.isArray(head) && head[0] === ';') {
    const [, init, cond, step] = head;
    return `for (${init ? codegen(init) : ''}; ${cond ? codegen(cond) : ''}; ${step ? codegen(step) : ''}) ${codegen(body)}`;
  }
  // For-in/of: head is ['in', lhs, rhs] or ['of', lhs, rhs]
  if (Array.isArray(head) && (head[0] === 'in' || head[0] === 'of')) {
    const [op, lhs, rhs] = head;
    return `for (${codegen(lhs)} ${op} ${codegen(rhs)}) ${codegen(body)}`;
  }
  return `for (${codegen(head)}) ${codegen(body)}`;
});

generator('return', a => a === undefined ? 'return' : `return ${codegen(a)}`);
generator('break', () => 'break');
generator('continue', () => 'continue');

// Unary keyword operators
generator('typeof', a => `(typeof ${codegen(a)})`);
generator('void', a => `(void ${codegen(a)})`);
generator('delete', a => `(delete ${codegen(a)})`);
generator('instanceof', (a, b) => `(${codegen(a)} instanceof ${codegen(b)})`);

// Function
generator('function', (name, params, body) => {
  const args = !params ? '' : params[0] === ',' ? params.slice(1).join(', ') : params;
  return name
    ? `function ${name}(${args}) ${codegen(body)}`
    : `function(${args}) ${codegen(body)}`;
});

generator('=>', (params, body) => {
  const args = !params ? '()' : typeof params === 'string' ? params :
    params[0] === ',' ? `(${params.slice(1).join(', ')})` : `(${params})`;
  const bod = body?.[0] === 'block' ? codegen(body) : codegen(body);
  return `${args} => ${bod}`;
});

export default codegen;
