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
import { parseBody, keyword } from './block.js';

const STATEMENT = 5;
const OPAREN = 40, CPAREN = 41;

// if (cond) body - returns ['if', cond, body], else handled separately
keyword('if', STATEMENT + 1, () => {
  space() === OPAREN || err('Expected (');
  skip();
  return ['if', expr(0, CPAREN), parseBody()];
});

// else as infix - attaches to innermost incomplete if (dangling else)
// Structural convention: body is always last (or second-to-last if last is decl string)
const findIf = n => {
  if (!Array.isArray(n)) return null;
  const [op] = n, len = n.length;
  if (op === 'if') return findIf(n[len === 3 ? 2 : 3]) || (len === 3 ? n : null);
  if (op === ';') return findIf(n[1]);
  return len > 2 ? findIf(typeof n[len - 1] === 'string' ? n[len - 2] : n[len - 1]) : null;
};
token('else', STATEMENT + 0.7, a => {
  const target = findIf(a);
  if (!target) return;
  target.push(parseBody());
  return a;
});
