/**
 * Object accessor properties (getters/setters) + method shorthand - parse half
 *
 *   { get x() { body } }         → ['{}', ['get', 'x', body]]
 *   { set x(v) { body } }        → ['{}', ['set', 'x', 'v', body]]
 *   { *g() { body } }            → ['{}', [':', 'g', ['function*', null, params, body]]]
 *   { m(p) { body } }            → ['{}', [':', 'm', ['function', null, params, body]]]
 */
import { token, expr, skip, next, parse, cur, idx, prec, seek } from '../parse.js';

const ASSIGN = 20, TOKEN = 200;
const LF = 10, CR = 13;
const DQUOTE = 34, HASH = 35, SQUOTE = 39, OPAREN = 40, CPAREN = 41, OBRACKET = 91, OBRACE = 123, CBRACE = 125;

const hasLineTerminator = (from, to) => {
  while (from < to) {
    const c = cur.charCodeAt(from++);
    if (c === LF || c === CR) return true;
  }
  return false;
};

const computedKeyStart = c => c === DQUOTE || c === SQUOTE || c === OBRACKET || c === HASH;
const propertyKey = () => next(parse.id) || (computedKeyStart(cur.charCodeAt(idx)) ? expr(TOKEN - .5) : null);

const isMethodKey = a =>
  typeof a === 'string' ||
  (Array.isArray(a) && (a[0] === undefined || a[0] === '[]'));

// The token dispatcher rewinds idx on failure; speculative member parsing
// must also restore the ASI flags before an expression handler retries.
const speculate = handler => a => {
  const newline = parse.newline, semi = parse.semi;
  const node = handler(a);
  if (!node) { parse.newline = newline; parse.semi = semi; }
  return node;
};

// Shared parser for get/set — returns false if not valid accessor pattern (falls through to identifier)
// Returns false (not undefined) to signal "fall through without setting reserved"
const accessor = (kind) => a => {
  if (a) return; // not prefix
  const from = idx;
  parse.space();
  if (parse.semi || hasLineTerminator(from, idx)) return false;
  const name = propertyKey();
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

// TOKEN, like `#` and `*`, so they fire inside `static`'s operand (unary prec
// 175): static get x() {} → ['static', ['get', 'x', params, body]]
token('get', TOKEN, speculate(accessor('get')));
token('set', TOKEN, speculate(accessor('set')));

// Generator method: { *g() {} } / class { *g() {} } / static *g() {}
//   → [':', key, ['function*', null, params, body]]   (≡ g: function* () {})
// Prefix-only: infix `*` falls through to multiplication. Registered at TOKEN
// so it fires inside `static`'s operand; prefix `*` is never valid JS outside
// member position, so the wide precedence can't misparse.
// token() re-registration would clobber prec['*'] (multiplication) in the
// introspection registry (loop.js reads it) — save/restore.
// A param list is method-shaped when every item could bind: identifier,
// default, rest, or destructuring pattern — `(1)`, `(a+b)` are expressions.
const paramish = n => n == null || typeof n === 'string' ||
  (Array.isArray(n) && (n[0] === ',' ? n.slice(1).every(paramish) :
    n[0] === '=' ? typeof n[1] === 'string' || paramish(n[1]) :
    n[0] === '...' || n[0] === '{}' || n[0] === '[]'));
const multPrec = prec['*'];
// `key(params) { body }` after the `*`, or nothing where that shape is not there
const generator = (member, name = propertyKey(), params) => {
  if (!name || parse.space() !== OPAREN) return;
  skip();
  params = expr(0, CPAREN) || null;
  if (member && !paramish(params) || parse.space() !== OBRACE) return;
  skip();
  return [':', name, ['function*', null, params, expr(0, CBRACE) || null]];
};
token('*', TOKEN, speculate(a => !a && (generator() || false)));
// Infix `*` is multiplication — EXCEPT at a member boundary: class bodies
// have no separators, so `ctor() {} *g() {}` reaches here with the previous
// member as `a` (ASI can't split on `*`: `x \n * y` must stay a product).
// Only a newline/block boundary + the full method shape + a bindable param
// list reads as a new member, joined the way asi() would join it. Below
// ASSIGN - 1 only, where a member stands: inside an operand (`x = y⏎*g()`,
// `static {}⏎*g() {}`) the `*` is the product's, or the next member's.
token('*', ASSIGN - 1, speculate((a, node) =>
  a && parse.newline && (node = generator(true)) && (a[0] === ';' ? (a.push(node), a) : [';', a, node])));
prec['*'] = multPrec;

// Method shorthand: { foo() {} } / { async foo() {} } / class { static foo() {} }
//   → [':', key, ['function', null, params, body]]   (≡ foo: function () {})
// A function, not an arrow: the body is statement-shaped (`{ f() }` returns
// undefined, an arrow's `f()` would be its value) and `this` is the receiver.
// Accepts identifier, string-literal node [, "..."], ['async', key] from
// async.js, or ['static', key] from unary('static').
// The head `key(params)` is the call the `(` rule has read; the body after it
// makes it a method. (Reading the params here and declining without a body left
// the call rule to read them again: 2^depth for nested calls.)
const bracePrec = prec['{'];
token('{', ASSIGN - 1, a => {
  if (a?.[0] !== '()' || a.length < 3) return;
  // ['static', key] from unary('static'): unwrap, re-wrap the resulting method node.
  // ['async', key] from async.js: unwrap, wrap the method value in async.
  let key = a[1], wrap, isAsync;
  if (Array.isArray(key) && key[0] === 'static') wrap = 'static', key = key[1];
  if (Array.isArray(key) && key[0] === 'async') isAsync = true, key = key[1];
  // Accept identifier or string-literal node as key
  if (!isMethodKey(key)) return;
  let value = ['function', null, a[2], expr(0, CBRACE) || null];
  if (isAsync) value = ['async', value];
  const node = [':', key, value];
  return wrap ? [wrap, node] : node;
});
prec['{'] = bracePrec;
