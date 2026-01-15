/**
 * Object accessor properties (getters/setters)
 *
 * AST:
 *   { get x() { body } }         → ['{}', ['get', 'x', body]]
 *   { set x(v) { body } }        → ['{}', ['set', 'x', 'v', body]]
 */
import { token, expr, skip, space, err, next, parse, cur, idx } from '../parse/pratt.js';

const ASSIGN = 20;
const OPAREN = 40, CPAREN = 41, OBRACE = 123, CBRACE = 125;

// Shared parser for get/set — returns false if not valid accessor pattern (falls through to identifier)
// Returns false (not undefined) to signal "fall through without setting reserved"
const accessor = (kind, hasParam) => a => {
  if (a) return; // not prefix
  space();
  const name = next(parse.id);
  if (!name) return false; // no property name = not accessor (e.g. `{ get: 1 }`)

  space();
  if (cur.charCodeAt(idx) !== OPAREN) return false; // not followed by ( = not accessor
  skip();

  const param = hasParam && (space(), next(parse.id));
  hasParam && !param && err('Expected parameter');

  space();
  cur.charCodeAt(idx) === CPAREN || err('Expected )');
  skip();

  space();
  cur.charCodeAt(idx) === OBRACE || err('Expected {');
  skip();

  return [kind, name, ...(hasParam ? [param] : []), expr(0, CBRACE)];
};

token('get', ASSIGN - 1, accessor('get', false));
token('set', ASSIGN - 1, accessor('set', true));
