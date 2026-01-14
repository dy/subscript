/**
 * throw statement
 *
 * AST:
 *   throw x  → ['throw', x]
 */
import { token, expr, space, err } from '../src/parse.js';

const STATEMENT = 5;

token('throw', STATEMENT + 1, a => {
  if (a) return;
  space() || err('Expected expression');
  return ['throw', expr(STATEMENT)];
});
