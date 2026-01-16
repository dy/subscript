/**
 * subscript: Default bundle (expr parser + JS compiler)
 *
 * Default parser is minimal (expr). For more features:
 *   subscript.parse = (await import('subscript/parse/justin.js')).parse  // + JSON, arrows, templates
 *   subscript.parse = (await import('subscript/parse/jessie.js')).parse  // + statements, functions
 *
 * Usage:
 *   subscript`a + b`(ctx)           - template tag, returns compiled evaluator
 *   subscript`a + ${x}`(ctx)        - interpolations: primitives, objects, AST nodes
 *   subscript('a + b')(ctx)         - direct call (no caching)
 *   subscript.parse = customParse   - swap parser
 *   subscript.compile = customCompile - swap compiler
 */
import { parse as exprParse } from './parse/expr.js';
import { compile as jsCompile, operator, operators, prop } from './compile/js.js';

export { parse } from './parse/expr.js';
export { token, binary, unary, nary, group, access, literal } from './parse/pratt.js';
export { compile, operator, operators, prop } from './compile/js.js';
export { codegen } from './compile/js-emit.js';

// Cache for compiled templates (keyed by template strings array reference)
const cache = new WeakMap();

// Template tag: subscript`a + b` or subscript`a + ${x}`
const subscript = (strings, ...values) =>
  // Direct call subscript('code') - strings is just a string
  typeof strings === 'string' ? subscript.compile(subscript.parse(strings)) :
  // Template literal - use cache
  cache.get(strings) || cache.set(strings, compileTemplate(strings, values)).get(strings);

// Compile template with placeholders
const compileTemplate = (strings, values) => {
  // Join with placeholder markers: __$0__, __$1__, etc.
  const code = strings.reduce((acc, s, i) => acc + (i ? `__$${i - 1}__` : '') + s, '');
  const ast = subscript.parse(code);
  // Replace placeholder identifiers with actual values in AST
  const inject = node =>
    typeof node === 'string' && node.startsWith('__$') && node.endsWith('__')
      ? injectValue(values[+node.slice(3, -2)])
      : Array.isArray(node) ? node.map(inject) : node;
  return subscript.compile(inject(ast));
};

// Detect AST node vs regular value
// AST: string (identifier), or array with string/undefined first element
const isAST = v =>
  typeof v === 'string' ||
  (Array.isArray(v) && (typeof v[0] === 'string' || v[0] === undefined));

// Inject value: AST nodes splice directly, others become literals
const injectValue = v => isAST(v) ? v : [, v];

// Configurable parse/compile (default to expr + js)
subscript.parse = exprParse;
subscript.compile = jsCompile;

export default subscript;
