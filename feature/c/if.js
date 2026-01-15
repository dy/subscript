/**
 * Conditionals: if/else
 *
 * AST:
 *   if (c) a else b    → ['if', c, a, b?]
 *
 * `else` is an infix operator - takes if result as left operand.
 * This lets expr loop handle comments between } and else naturally.
 */
import { token, space, skip, expr, err } from '../../parse/pratt.js';
import { parseBody, prefix } from '../block.js';

const STATEMENT = 5;
const OPAREN = 40, CPAREN = 41;

// if (cond) body - returns ['if', cond, body], else handled separately
prefix('if', STATEMENT + 1, () => {
  space() === OPAREN || err('Expected (');
  skip();
  return ['if', expr(0, CPAREN), parseBody()];
});

// else as infix - extends ['if', cond, body] with alt branch
// Precedence 5.7: higher than parseBody's 5.5 so else can attach inside while/for
// Lower than if (6) so it binds after if returns
// Attaches to innermost if without alt (dangling else problem)
// Also handles: a = [';', [while, [if, c, body]], ...] where else should attach to inner if
const innerIf = n => n?.[0] !== 'if' ? null : n.length === 3 ? innerIf(n[2]) || n : innerIf(n[3]);
// Find innermost incomplete if in control structures
const findIf = n => {
  if (!Array.isArray(n)) return null;
  const op = n[0];
  // Direct if
  if (op === 'if') return n.length === 3 ? innerIf(n[2]) || n : innerIf(n[3]);
  // Sequence: check first element (most recent statement)
  if (op === ';') return findIf(n[1]);
  // Control structures with body as last element: while, for, for-of, for-in
  if (op === 'while' || op === 'for' || op === 'for-of' || op === 'for-in') return findIf(n[n.length - 1]);
  return null;
};
token('else', STATEMENT + 0.7, a => {
  const target = findIf(a);
  if (!target) return;
  target.push(parseBody());
  return a;
});
