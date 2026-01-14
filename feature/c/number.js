/**
 * Numbers (C-family): + 0x hex, 0 octal
 *
 * Extends root number.js with C-style prefix notation.
 * Import after feature/number.js
 */
import { lookup, next, err, skip, idx, cur } from '../../parse/pratt.js';

const _0 = 48, _9 = 57, _a = 97, _f = 102, _A = 65, _F = 70;
const _b = 98, _B = 66, _o = 111, _O = 79, _x = 120, _X = 88;
const PERIOD = 46, _E = 69, _e = 101, PLUS = 43, MINUS = 45;

// Decimal number parser (same as root)
const num = a => [, (
  a = +next(c => c === PERIOD || (c >= _0 && c <= _9) || ((c === _E || c === _e) && ((c = cur.charCodeAt(idx + 1)) >= _0 && c <= _9 || c === PLUS || c === MINUS) ? 2 : 0))
) != a ? err() : a];

// Override 0 to handle prefixes: 0x, 0b, 0o, 0 (octal)
lookup[_0] = a => {
  if (a) return err();
  const c = cur.charCodeAt(idx + 1);
  return c === _b || c === _B ? (skip(2), [, parseInt(next(c => c === 48 || c === 49), 2)]) :
         c === _o || c === _O ? (skip(2), [, parseInt(next(c => c >= 48 && c <= 55), 8)]) :
         c === _x || c === _X ? (skip(2), [, parseInt(next(c => (c >= _0 && c <= _9) || (c >= _a && c <= _f) || (c >= _A && c <= _F)), 16)]) :
         num();
};
