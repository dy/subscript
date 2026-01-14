/**
 * Function declarations and expressions
 *
 * AST:
 *   function f(a,b) { body }      → ['function', 'f', ['a','b'], body]
 *   function(a,b) { body }        → ['function', null, ['a','b'], body]
 *   function f(a, ...rest) {}     → ['function', 'f', ['a', ['...', 'rest']], body]
 */
import { cur, idx, token, expr, skip, space, err, next, parse } from '../parse/pratt.js';

const STATEMENT = 5, TOKEN = 200;
const OPAREN = 40, CPAREN = 41, OBRACE = 123, CBRACE = 125, COMMA = 44, PERIOD = 46, SEMI = 59;

// Parse comma-separated identifiers in parens, supports ...rest
const parseParams = () => {
  cur.charCodeAt(idx) === OPAREN || err('Expected (');
  skip();
  const params = [];
  for (let cc; (cc = space()) !== CPAREN;) {
    // ...rest
    if (cc === PERIOD && cur.charCodeAt(idx + 1) === PERIOD && cur.charCodeAt(idx + 2) === PERIOD) {
      params.push(expr(0));
      space() !== CPAREN && err('Rest parameter must be last');
      break;
    }
    const p = next(parse.id);
    p || err('Expected parameter');
    params.push(p);
    space() === COMMA ? skip() : cur.charCodeAt(idx) !== CPAREN && err('Expected , or )');
  }
  return skip(), params;
};

// Parse { stmts } into single AST node
const parseBlock = () => {
  space() === OBRACE || err('Expected {');
  skip();
  const stmts = [];
  while (space() !== CBRACE) (s => s && stmts.push(s))(expr(STATEMENT)), space() === SEMI && skip();
  return skip(), stmts.length < 2 ? stmts[0] || null : [';', ...stmts];
};

token('function', TOKEN, a => {
  if (a) return;
  space();
  const name = cur.charCodeAt(idx) !== OPAREN ? next(parse.id) : null;
  name && space();
  return ['function', name, parseParams(), parseBlock()];
});
