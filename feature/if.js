/**
 * Conditionals: if/else
 *
 * AST:
 *   if (c) a else b    → ['if', c, a, b?]
 *
 * `else` is an infix operator - takes if result as left operand.
 * This lets expr loop handle comments between } and else naturally.
 */
import { operator, compile } from '../src/compile.js';
import { PREC_STATEMENT, OPAREN, CPAREN } from '../src/const.js';
import { token, space, skip, expr, err } from '../src/parse.js';
import { parseBody, prefix } from './block.js';

// if (cond) body - returns ['if', cond, body], else handled separately
prefix('if', PREC_STATEMENT + 1, () => {
  space() === OPAREN || err('Expected (');
  skip();
  return ['if', expr(0, CPAREN), parseBody()];
});

// else as infix - extends ['if', cond, body] with alt branch
// Lower precedence than if (5.5 vs 6) so it binds after if returns
// Attaches to innermost if without alt (dangling else problem)
const innerIf = n => n?.[0] !== 'if' ? null : n.length === 3 ? innerIf(n[2]) || n : innerIf(n[3]);
token('else', PREC_STATEMENT + 0.5, a => {
  const target = innerIf(a);
  if (!target) return;
  target.push(parseBody());
  return a;
});

operator('if', (cond, body, alt) => {
  cond = compile(cond); body = compile(body); alt = alt !== undefined ? compile(alt) : null;
  return ctx => cond(ctx) ? body(ctx) : alt?.(ctx);
});
