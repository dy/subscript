/**
 * Optional chaining operators - parse half
 *
 * a?.b → optional member access
 * a?.[x] → optional computed access
 * a?.() → optional call
 */
import { token, expr, skip, space } from '../../parse.js';

const ACCESS = 170;

token('?.', ACCESS, (a, b) => {
  if (!a) return;
  const cc = space();
  // Optional call: a?.()
  if (cc === 40) { skip(); return ['?.()', a, expr(0, 41) || null]; }
  // Optional computed: a?.[x]
  if (cc === 91) { skip(); return ['?.[]', a, expr(0, 93)]; }
  // Optional member: a?.b
  b = expr(ACCESS);
  return b ? ['?.', a, b] : void 0;
});
