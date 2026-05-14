/**
 * Object accessor properties (getters/setters) - parse half
 *
 *   { get x() { body } }         → ['{}', ['get', 'x', body]]
 *   { set x(v) { body } }        → ['{}', ['set', 'x', 'v', body]]
 */
import { token, expr, skip, next, parse, cur, idx } from '../parse.js';

const ASSIGN = 20;
const LF = 10, CR = 13;
const OPAREN = 40, CPAREN = 41, OBRACE = 123, CBRACE = 125;

const hasLineTerminator = (from, to) => {
  while (from < to) {
    const c = cur.charCodeAt(from++);
    if (c === LF || c === CR) return true;
  }
  return false;
};

// Shared parser for get/set — returns false if not valid accessor pattern (falls through to identifier)
// Returns false (not undefined) to signal "fall through without setting reserved"
const accessor = (kind) => a => {
  if (a) return; // not prefix
  const from = idx;
  parse.space();
  if (parse.semi || hasLineTerminator(from, idx)) return false;
  const name = next(parse.id);
  if (!name) return false; // no property name = not accessor (e.g. `{ get: 1 }`)
  parse.space();
  if (cur.charCodeAt(idx) !== OPAREN) return false; // not followed by ( = not accessor
  skip();
  const params = expr(0, CPAREN);
  parse.space();
  if (cur.charCodeAt(idx) !== OBRACE) return false;
  skip();
  return [kind, name, params, expr(0, CBRACE)];
};

token('get', ASSIGN - 1, accessor('get'));
token('set', ASSIGN - 1, accessor('set'));

// Method shorthand: { foo() {} } / { "foo"() {} } / class { static foo() {} }
//   → [':', key, ['=>', ['()', params], body]]
// Accepts identifier, string-literal node [, "..."], or ['static', key] from unary('static').
token('(', ASSIGN - 1, a => {
  if (!a) return;
  // ['static', key] from unary('static'): unwrap, re-wrap the resulting method node.
  let wrap;
  if (Array.isArray(a) && a[0] === 'static') wrap = 'static', a = a[1];
  // Accept identifier or string-literal node as key
  if (typeof a !== 'string' && !(Array.isArray(a) && a[0] === undefined)) return;
  const params = expr(0, CPAREN) || null;
  parse.space();
  // Not followed by { - not method shorthand, fall through
  if (cur.charCodeAt(idx) !== OBRACE) return;
  skip();
  const node = [':', a, ['=>', ['()', params], expr(0, CBRACE) || null]];
  return wrap ? [wrap, node] : node;
});
