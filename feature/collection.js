/**
 * Collection literals: arrays and objects (Justin feature)
 *
 * [a, b, c]
 * {a: 1, b: 2}
 * {a, b} (shorthand)
 */
import { group, binary, skip, space, expr, token } from '../src/parse.js';

const STATEMENT = 5, ASSIGN = 20, TOKEN = 200;
const CBRACE = 125, SEMI = 59;

// [a,b,c]
group('[]', TOKEN);

// {a:1, b:2, c:3} - object literal / block
token('{', TOKEN, a => {
  if (a) return; // not prefix - let other handlers try

  // Parse statements until }
  const stmts = [];
  while (space() !== CBRACE) {
    const stmt = expr(STATEMENT);
    if (stmt) stmts.push(stmt);
    while (space() === SEMI) skip();
  }
  skip(); // consume }

  const content = stmts.length === 0 ? null : stmts.length === 1 ? stmts[0] : [';', ...stmts];
  return ['{}', content];
});

// a: b (colon operator for object properties)
binary(':', ASSIGN - 1, true);
