/**
 * Object accessor properties (getters/setters)
 *
 * AST:
 *   { get x() { body } }         → ['{}', ['get', 'x', body]]
 *   { set x(v) { body } }        → ['{}', ['set', 'x', 'v', body]]
 */
import { token, expr, skip, space, next, parse, cur, idx, operator, compile } from '../parse.js';

// Accessor marker for object property definitions
export const ACC = Symbol('accessor');

const ASSIGN = 20;
const OPAREN = 40, CPAREN = 41, OBRACE = 123, CBRACE = 125;

// Shared parser for get/set — returns false if not valid accessor pattern (falls through to identifier)
// Returns false (not undefined) to signal "fall through without setting reserved"
const accessor = (kind) => a => {
  if (a) return; // not prefix
  space();
  const name = next(parse.id);
  if (!name) return false; // no property name = not accessor (e.g. `{ get: 1 }`)
  space();
  if (cur.charCodeAt(idx) !== OPAREN) return false; // not followed by ( = not accessor
  skip();
  const params = expr(0, CPAREN);
  space();
  if (cur.charCodeAt(idx) !== OBRACE) return false;
  skip();
  return [kind, name, params, expr(0, CBRACE)];
};

token('get', ASSIGN - 1, accessor('get'));
token('set', ASSIGN - 1, accessor('set'));

// Method shorthand: { foo() {} } → [':', 'foo', ['=>', ['()', params], body]]
// Uses token() infix handler - returns undefined to fall through to function call
token('(', ASSIGN - 1, a => {
  // Only handle infix position with plain identifier in low-precedence context (object literal)
  if (!a || typeof a !== 'string') return;
  const params = expr(0, CPAREN) || null;
  space();
  // Not followed by { - not method shorthand, fall through
  if (cur.charCodeAt(idx) !== OBRACE) return;
  skip();
  return [':', a, ['=>', ['()', params], expr(0, CBRACE) || null]];
});

// Compile
operator('get', (name, body) => {
  body = body ? compile(body) : () => {};
  return ctx => [[ACC, name, {
    get: function() { const s = Object.create(ctx || {}); s.this = this; return body(s); }
  }]];
});

operator('set', (name, param, body) => {
  body = body ? compile(body) : () => {};
  return ctx => [[ACC, name, {
    set: function(v) { const s = Object.create(ctx || {}); s.this = this; s[param] = v; body(s); }
  }]];
});
