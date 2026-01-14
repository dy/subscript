/**
 * Numbers (universal): 123, 1.5, 1e3, -1
 * 
 * Minimal portable number format: decimal only, no prefix notation.
 * For hex/octal/binary, import c/number.js or js/number.js
 */
import { lookup, next, err, idx, cur } from '../parse/pratt.js';

const PERIOD = 46, _0 = 48, _9 = 57, _E = 69, _e = 101, PLUS = 43, MINUS = 45;

const num = a => [, (
  a = +next(c => c === PERIOD || (c >= _0 && c <= _9) || ((c === _E || c === _e) && ((c = cur.charCodeAt(idx + 1)) >= _0 && c <= _9 || c === PLUS || c === MINUS) ? 2 : 0))
) != a ? err() : a];

// .1
lookup[PERIOD] = a => !a && num();

// 0-9
for (let i = _0; i <= _9; i++) lookup[i] = a => a ? err() : num();
