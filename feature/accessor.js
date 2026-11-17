/**
 * Object accessor properties (getters/setters) + method shorthand - parse half
 *
 *   { get x() { body } }         → ['{}', ['get', 'x', body]]
 *   { set x(v) { body } }        → ['{}', ['set', 'x', 'v', body]]
 *   { *g() { body } }            → ['{}', [':', 'g', ['function*', null, params, body]]]
 *   { m(p) { body } }            → ['{}', [':', 'm', ['function', null, params, body]]]
 */
import { token, expr, skip, next, parse, cur, idx, prec, seek, lookup, loc } from '../parse.js';

const ASSIGN = 20, CALL = 160, ACCESS = 170, TOKEN = 200;
const LF = 10, CR = 13;
const DQUOTE = 34, HASH = 35, SQUOTE = 39, OPAREN = 40, CPAREN = 41, OBRACKET = 91, CBRACKET = 93, OBRACE = 123, CBRACE = 125;

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

// A member head `key(…)` is a member only when a body follows its `(…)`. A rule
// that reads the `(…)` and finds no body gives the span back, kept here: the
// next `(` read at its offset, as the group or the call, takes these contents
// instead of reading them again. Read again, the span doubled the work at
// every level of nesting: 2^depth for `set in (set in (x))`.
let kept = -1, keptIn, keptEnd, keptArgs, keptNl, keptSemi;
// The `(…)` at idx: its contents, kept until a body is read after them.
const args = (at = idx, a) => (skip(), a = expr(0, CPAREN),
  kept = at, keptIn = cur, keptEnd = idx, keptArgs = a, keptNl = parse.newline, keptSemi = parse.semi, a);
// The `{ body }` after kept contents: they belong to a member now.
const body = () => (kept = -1, keptIn = keptArgs = null, skip(), expr(0, CBRACE));
const take = (a, at, node = loc(a ? ['()', a, keptArgs || null] : ['()', keptArgs || null], at)) => (
  seek(keptEnd), parse.newline = keptNl, parse.semi = keptSemi, kept = -1, keptIn = keptArgs = null, node);

// Shared parser for get/set — returns false if not valid accessor pattern (falls through to identifier)
// Returns false (not undefined) to signal "fall through without setting reserved"
// Before `[` it marks the bracket and declines, as async does: `get` reads as a
// name and the `[` rule below reads the bracket once.
// Without a body `get key(…)` is an expression, `get in (o)`: the rule declines
// and its `(…)` is kept for the expression's group.
let head = -1, headAt, headIn;
const accessor = (kind) => a => {
  if (a) return; // not prefix
  const from = idx;
  parse.space();
  if (parse.semi || hasLineTerminator(from, idx)) return false;
  if (cur.charCodeAt(idx) === OBRACKET) return head = idx, headAt = from - 3, headIn = cur, false;
  const name = propertyKey();
  if (!name) return false; // no property name = not accessor (e.g. `{ get: 1 }`)
  parse.space();
  if (cur.charCodeAt(idx) !== OPAREN) return false; // not followed by ( = not accessor
  const params = args();
  return parse.space() === OBRACE && [kind, name, params, body()];
};

// TOKEN, like `#` and `*`, so they fire inside `static`'s operand (unary prec
// 175): static get x() {} → ['static', ['get', 'x', params, body]]
token('get', TOKEN, speculate(accessor('get')));
token('set', TOKEN, speculate(accessor('set')));

// get […]: the index of the name `get`, or an accessor's computed key when
// `(…) {` follows. Without a body the `(…)` is kept and the index returned: the
// loop reads the `(…)` as its call, or ASI as a statement of its own, as after
// any other name. Where the loop reads no call (`new`'s callee, at CALL) the
// call is made here, the one `new` would read.
const bracket = lookup[OBRACKET];
lookup[OBRACKET] = (a, prec, op, from = idx, at = headAt, k, call, nl, semi, params) => {
  if ((a !== 'get' && a !== 'set') || from !== head || cur !== headIn) return bracket(a, prec, op);
  skip();
  k = loc(['[]', a, expr(0, CBRACKET) || null], from);
  if (parse.space() !== OPAREN) return k;
  call = idx, nl = parse.newline, semi = parse.semi, params = args();
  if (parse.space() === OBRACE) return loc([a, loc(['[]', k[2]], from), params, body()], at);
  return prec < CALL ? (seek(call), parse.newline = nl, parse.semi = semi, k) : take(k, call);
};

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
// The rest of a generator method after `*` and its key: `(params) { body }`.
// Without a body its `(…)` stays kept for the expression that reads `key(…)`:
// `async *g(x)` is a product, and its call takes the kept contents.
const generator = (name, infix, params) => {
  if (!name || parse.space() !== OPAREN) return;
  params = args() || null;
  if (infix && !paramish(params) || parse.space() !== OBRACE) return;
  return [':', name, ['function*', null, params, body() || null]];
};
const multPrec = prec['*'];
token('*', TOKEN, speculate(a => !a && generator(propertyKey()) || (a ? void 0 : false)));
prec['*'] = multPrec;

// Infix `*` is multiplication — EXCEPT at a member boundary: class bodies have
// no separators, so `ctor() {} *g() {}` and `x⏎*g() {}` reach here with the
// member before as `a` (ASI can't split on `*`: `x \n * y` must stay a product).
// With a key right after `*`, the right side is read once, as the product's: a
// call of a key with a bindable param list and a body after it is a new member,
// joined the way asi() would join it, and anything else is the product. Reading
// the member first and then, with no body, the product read `g(…)` twice a
// level (`y⏎*g(y⏎*g(…))`). A key that reads otherwise as an operand (`typeof`,
// `1`, `true`) is read again as a key when a body follows.
const STAR = 42;
const plainKey = k => typeof k === 'string' || Array.isArray(k) &&
  (k[0] === '[]' && k.length === 2 || k[0] === undefined && typeof k[1] === 'string');
const star = lookup[STAR];
lookup[STAR] = (a, prec, op, from = idx, c = cur.charCodeAt(from + 1)) => {
  if (!a || !parse.newline || prec >= multPrec || !(parse.id(c) || computedKeyStart(c))) return star(a, prec, op);
  skip();
  const rhs = expr(multPrec), end = idx, newline = parse.newline, semi = parse.semi;
  if (!rhs) return seek(from), star(a, prec, op);
  let node;
  if (parse.space() === OBRACE) {
    if (rhs[0] === '()' && plainKey(rhs[1])) node = paramish(rhs[2]) && (skip(), [':', rhs[1], ['function*', null, rhs[2], expr(0, CBRACE) || null]]);
    else if (!(seek(from + 1), node = generator(propertyKey(), true))) seek(end), parse.newline = newline, parse.semi = semi;
  }
  return !node ? loc(['*', a, rhs], from) : a[0] === ';' ? (a.push(node), loc(a, from)) : loc([';', a, node], from);
};

// Method shorthand: { foo() {} } / { async foo() {} } / class { static foo() {} }
//   → [':', key, ['function', null, params, body]]   (≡ foo: function () {})
// A function, not an arrow: the body is statement-shaped (`{ f() }` returns
// undefined, an arrow's `f()` would be its value) and `this` is the receiver.
// Accepts identifier, string-literal node [, "..."], ['async', key] from
// async.js, or ['static', key] from unary('static').
// The head is a call, read once by the `(` rules before this one; a body after
// it makes it a method. Reading the parameters here and declining without a
// body made the call rule read them again: 2^depth for nested calls.
// Below ASSIGN - 1 only: a member stands there, never an operand.
// A `(…)` kept above is taken where the group (ACCESS) or the call (CALL) would
// read it.
const call = lookup[OPAREN];
lookup[OPAREN] = (a, prec, op, from = idx) => {
  const c = from === kept && cur === keptIn && prec < (a ? CALL : ACCESS) ? take(a, from) : call(a, prec, op);
  if (!a || prec >= ASSIGN - 1 || c?.[0] !== '()' || c[1] !== a) return c;
  // ['static', key] from unary('static'): unwrap, re-wrap the resulting method node.
  // ['async', key] from async.js: unwrap, wrap the method value in async.
  let key = a, wrap, isAsync;
  if (Array.isArray(key) && key[0] === 'static') wrap = 'static', key = key[1];
  if (Array.isArray(key) && key[0] === 'async') isAsync = true, key = key[1];
  if (!isMethodKey(key) || parse.space() !== OBRACE) return c;
  skip();
  let value = ['function', null, c[2], expr(0, CBRACE) || null];
  if (isAsync) value = ['async', value];
  const node = [':', key, value];
  return loc(wrap ? [wrap, node] : node, from);
};
