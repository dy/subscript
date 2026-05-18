/**
 * Optional chaining operators - parse half
 *
 * a?.b → optional member access
 * a?.[x] → optional computed access
 * a?.() → optional call
 */
import { parse, token, expr, skip, propName } from '../../parse.js';

const ACCESS = 170;

token('?.', ACCESS, (a, b) => {
  if (!a) return;
  const cc = parse.space();
  // Optional call: a?.()
  if (cc === 40) { skip(); return ['?.()', a, expr(0, 41) || null]; }
  // Optional computed: a?.[x]
  if (cc === 91) { skip(); return ['?.[]', a, expr(0, 93)]; }
  // Optional member: a?.b - property name is an IdentifierName
  b = propName(ACCESS);
  return b ? ['?.', a, b] : void 0;
});
