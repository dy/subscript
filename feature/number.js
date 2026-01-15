/**
 * Numbers with configurable prefix notation
 *
 * Configurable via parse.number: { '0x': 16, '0b': 2, '0o': 8 }
 */
import { parse, lookup, next, err, skip, idx, cur } from '../parse/pratt.js';

const PERIOD = 46, _0 = 48, _9 = 57, _E = 69, _e = 101, PLUS = 43, MINUS = 45;
const _a = 97, _f = 102, _A = 65, _F = 70;

// Decimal number
const num = a => [, (
  a = +next(c => c === PERIOD || (c >= _0 && c <= _9) || ((c === _E || c === _e) && ((c = cur.charCodeAt(idx + 1)) >= _0 && c <= _9 || c === PLUS || c === MINUS) ? 2 : 0))
) != a ? err() : a];

// Char test for prefix base
const charTest = {
  2: c => c === 48 || c === 49,
  8: c => c >= 48 && c <= 55,
  16: c => (c >= _0 && c <= _9) || (c >= _a && c <= _f) || (c >= _A && c <= _F)
};

// Default: no prefixes
parse.number = null;

// .1
lookup[PERIOD] = a => !a && num();

// 0-9: check parse.number for prefix config
for (let i = _0; i <= _9; i++) lookup[i] = a => a ? void 0 : num();
lookup[_0] = a => {
  if (a) return;
  const cfg = parse.number;
  if (cfg) {
    for (const [pre, base] of Object.entries(cfg)) {
      if (pre[0] === '0' && cur[idx + 1]?.toLowerCase() === pre[1]) {
        skip(2);
        return [, parseInt(next(charTest[base]), base)];
      }
    }
  }
  return num();
};
