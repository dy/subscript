/**
 * Switch statement
 *
 * AST:
 *   switch (val) { case x: a; break; default: b }
 *   → ['switch', val, [[x, body], ..., [null, body]]]
 */
import { token, expr, skip, space, err } from '../parse/pratt.js';
import { isWord } from './block.js';

const STATEMENT = 5, ASSIGN = 20;
const OPAREN = 40, CPAREN = 41, OBRACE = 123, CBRACE = 125, COLON = 58, SEMI = 59;

// Parse case body until next case/default/}
const parseCaseBody = () => {
  const stmts = [];
  while (space() !== CBRACE && !isWord('case') && !isWord('default'))
    (s => s && stmts.push(s))(expr(STATEMENT)), space() === SEMI && skip();
  return stmts.length < 2 ? stmts[0] || null : [';', ...stmts];
};

token('switch', STATEMENT + 1, a => {
  if (a) return;
  space() === OPAREN || err('Expected (');
  skip();
  const val = expr(0, CPAREN);
  space() === OBRACE || err('Expected {');
  skip();

  const cases = [];
  let hasDefault = false;

  while (space() !== CBRACE) {
    if (isWord('case')) {
      skip(4); space();
      const test = expr(ASSIGN);
      space() === COLON ? skip() : err('Expected :');
      cases.push([test, parseCaseBody()]);
    } else if (isWord('default')) {
      hasDefault && err('Duplicate default');
      hasDefault = true;
      skip(7);
      space() === COLON ? skip() : err('Expected :');
      cases.push([null, parseCaseBody()]);
    } else err('Expected case or default');
  }
  return skip(), ['switch', val, cases];
});
