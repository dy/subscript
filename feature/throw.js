/**
 * throw statement
 *
 * AST:
 *   throw x  → ['throw', x]
 */
import { token, expr, space, err } from '../src/parse.js';
import { operator, compile } from '../src/compile.js';
import { PREC_STATEMENT } from '../src/const.js';

token('throw', PREC_STATEMENT + 1, a => {
  if (a) return;
  space() || err('Expected expression');
  return ['throw', expr(PREC_STATEMENT)];
});

operator('throw', val => {
  val = compile(val);
  return ctx => { throw val(ctx); };
});
