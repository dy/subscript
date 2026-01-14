/**
 * Conditionals: if/else
 *
 * AST:
 *   if (c) a else b    → ['if', c, a, b?]
 *
 * `else` is an infix operator - takes if result as left operand.
 * This lets expr loop handle comments between } and else naturally.
 */
import { token, space, skip, expr, err } from '../parse/pratt.js';
import { parseBody, prefix } from './block.js';

const STATEMENT = 5;
const OPAREN = 40, CPAREN = 41;

// if (cond) body - returns ['if', cond, body], else handled separately
prefix('if', STATEMENT + 1, () => {
  space() === OPAREN || err('Expected (');
  skip();
  return ['if', expr(0, CPAREN), parseBody()];
});

// else as infix - extends ['if', cond, body] with alt branch
// Lower precedence than if (5.5 vs 6) so it binds after if returns
// Attaches to innermost if without alt (dangling else problem)
const innerIf = n => n?.[0] !== 'if' ? null : n.length === 3 ? innerIf(n[2]) || n : innerIf(n[3]);
token('else', STATEMENT + 0.5, a => {
  const target = innerIf(a);
  if (!target) return;
  target.push(parseBody());
  return a;
});
