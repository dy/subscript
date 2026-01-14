/**
 * Switch statement
 *
 * AST:
 *   switch (val) { case x: a; break; default: b }
 *   → ['switch', val, [[x, body], ..., [null, body]]]
 */
import { token, expr, skip, space, err } from '../src/parse.js';
import { operator, compile } from '../src/compile.js';
import { PREC_STATEMENT, PREC_ASSIGN, OPAREN, CPAREN, OBRACE, CBRACE, COLON, SEMI } from '../src/const.js';
import { BREAK, isWord } from './block.js';

// Parse case body until next case/default/}
const parseCaseBody = () => {
  const stmts = [];
  while (space() !== CBRACE && !isWord('case') && !isWord('default'))
    (s => s && stmts.push(s))(expr(PREC_STATEMENT)), space() === SEMI && skip();
  return stmts.length < 2 ? stmts[0] || null : [';', ...stmts];
};

token('switch', PREC_STATEMENT + 1, a => {
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
      const test = expr(PREC_ASSIGN);
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

operator('switch', (val, cases) => {
  val = compile(val);
  cases = cases.map(([t, b]) => [t && compile(t), b ? compile(b) : () => {}]);

  return ctx => {
    const v = val(ctx);
    let matched = false, result;
    for (const [test, body] of cases) {
      if (matched || test === null || test(ctx) === v) {
        matched = true;
        try { result = body(ctx); }
        catch (e) { if (e === BREAK) return result; throw e; }
      }
    }
    return result;
  };
});
