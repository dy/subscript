/**
 * Numbers with configurable prefix notation
 *
 * Configurable via parse.number: { '0x': 16, '0b': 2, '0o': 8 }
 */
import { parse, lookup, next, err, skip, seek, idx, cur } from '../parse.js';

const PERIOD = 46, _0 = 48, _9 = 57, _E = 69, _e = 101, PLUS = 43, MINUS = 45, UNDERSCORE = 95, _n = 110;
const _a = 97, _f = 102, _A = 65, _F = 70;

// Strip underscores only if present (avoid allocation for common case)
const strip = s => s.indexOf('_') < 0 ? s : s.replaceAll('_', '');

const digit = c => c >= _0 && c <= _9;
const digitOrSep = c => digit(c) || c === UNDERSCORE;

// Decimal number - check for .. range operator (don't consume . if followed by .)
// Supports numeric separators: 1_000_000 and BigInt suffix: 123n
const num = a => {
  const from = idx;

  if (cur.charCodeAt(idx) === PERIOD) skip();
  next(digitOrSep);

  if (cur.charCodeAt(idx) === PERIOD && cur.charCodeAt(idx + 1) !== PERIOD) {
    skip();
    next(digitOrSep);
  }

  const exp = cur.charCodeAt(idx);
  if (exp === _E || exp === _e) {
    let at = idx + 1, sign = cur.charCodeAt(at);
    if (sign === PLUS || sign === MINUS) at++;
    if (digit(cur.charCodeAt(at))) {
      seek(at + 1);
      next(digitOrSep);
    }
  }

  let str = strip(cur.slice(from, idx));
  // BigInt suffix
  if (cur.charCodeAt(idx) === _n) { skip(); return [, BigInt(str)]; }
  return (a = +str) != a ? err() : [, a];
};

// Char test for prefix base (with underscore support)
const charTest = {
  2: c => c === 48 || c === 49 || c === UNDERSCORE,
  8: c => (c >= 48 && c <= 55) || c === UNDERSCORE,
  16: c => (c >= _0 && c <= _9) || (c >= _a && c <= _f) || (c >= _A && c <= _F) || c === UNDERSCORE
};

// Default: no prefixes
parse.number = null;

// .1 (but not .. range)
lookup[PERIOD] = a => !a && digit(cur.charCodeAt(idx + 1)) && num();

// 0-9: check parse.number for prefix config
for (let i = _0; i <= _9; i++) lookup[i] = a => a ? void 0 : num();
lookup[_0] = a => {
  if (a) return;
  const cfg = parse.number;
  if (cfg) {
    for (const [pre, base] of Object.entries(cfg)) {
      if (pre[0] === '0' && cur[idx + 1]?.toLowerCase() === pre[1]) {
        skip(2);
        const str = strip(next(charTest[base]));
        if (cur.charCodeAt(idx) === _n) { skip(); return [, BigInt('0' + pre[1] + str)]; }
        return [, parseInt(str, base)];
      }
    }
  }
  return num();
};
