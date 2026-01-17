/**
 * subscript: Minimal expression parser + compiler
 *
 * Usage:
 *   subscript`a + b`(ctx)           - template tag, returns compiled evaluator
 *   subscript`a + ${x}`(ctx)        - interpolations: primitives, objects, AST nodes
 *   subscript('a + b')(ctx)         - direct call (no caching)
 *
 * For more features:
 *   import { parse, compile } from 'subscript/justin.js'  // + JSON, arrows, templates
 *   import { parse, compile } from 'subscript/jessie.js'  // + statements, functions
 */

// Expression features
import './feature/number.js';       // Decimal numbers: 123, 1.5, 1e3
import './feature/string.js';       // Double-quoted strings with escapes

// Operators (C-family common set) - order matters for token chain performance
import './feature/op/assignment.js';  // = += -= *= /= %= |= &= ^= >>= <<=
import './feature/op/logical.js';     // ! && ||
import './feature/op/bitwise.js';     // ~ | & ^ >> <<
import './feature/op/comparison.js';  // < > <= >=
import './feature/op/equality.js';    // == !=
import './feature/op/arithmetic.js';  // + - * / %
import './feature/op/increment.js';   // ++ --

import './feature/group.js';          // Grouping: (a), sequences: a, b; a; b
import './feature/member.js';         // Property access: a.b, a[b], f(), [a,b]

import { parse, compile } from './parse.js';
export * from './parse.js';

// Cache for compiled templates (keyed by template strings array reference)
const cache = new WeakMap();

// Template tag: subscript`a + b` or subscript`a + ${x}`
const subscript = (strings, ...values) =>
  // Direct call subscript('code') - strings is just a string
  typeof strings === 'string' ? compile(parse(strings)) :
  // Template literal - use cache
  cache.get(strings) || cache.set(strings, compileTemplate(strings, values)).get(strings);

// Compile template with placeholders (using Private Use Area chars)
const PUA = 0xE000;
const compileTemplate = (strings, values) => {
  const code = strings.reduce((acc, s, i) => acc + (i ? String.fromCharCode(PUA + i - 1) : '') + s, '');
  const ast = parse(code);
  const inject = node => {
    if (typeof node === 'string' && node.length === 1) {
      let i = node.charCodeAt(0) - PUA, v;
      if (i >= 0 && i < values.length) return v = values[i], isAST(v) ? v : [, v];
    }
    return Array.isArray(node) ? node.map(inject) : node;
  };
  return compile(inject(ast));
};

// Detect AST node vs regular value
// AST: string (identifier), or array with string/undefined first element
const isAST = v =>
  typeof v === 'string' ||
  (Array.isArray(v) && (typeof v[0] === 'string' || v[0] === undefined));

export default subscript;
