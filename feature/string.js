/**
 * String literals with ES escape sequences.
 * Configurable via parse.string: { '"': true, "'": true }
 */
import { parse, lookup, next, err, skip, idx, cur } from '../parse.js';

const BSLASH = 92, DQUOTE = 34, SQUOTE = 39, U = 117, X = 120, LBRACE = 123, RBRACE = 125, LF = 10, CR = 13;
const esc = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', '0': '\0' };

// Hex digit code → value (−1 if not hex)
const hex = c =>
  c >= 48 && c <= 57 ? c - 48 :
  c >= 65 && c <= 70 ? c - 55 :
  c >= 97 && c <= 102 ? c - 87 : -1;

// `s` is the closed-over accumulator shared with the escape handler.
const parseString = q => (a, _, s = '', qc = String.fromCharCode(q)) => {
  if (a || !parse.string?.[qc]) return;
  skip();

  // Decode escape at idx (a BSLASH); append to s, return source chars consumed.
  // Malformed escapes fall back to literal next char.
  const escape = () => {
    const n = cur.charCodeAt(idx + 1);
    if (n === LF) return 2;
    if (n === CR) return cur.charCodeAt(idx + 2) === LF ? 3 : 2;
    // \xHH or \uHHHH
    if (n === X || (n === U && cur.charCodeAt(idx + 2) !== LBRACE)) {
      const w = n === X ? 2 : 4;
      let cp = 0, h;
      for (let k = 0; k < w; k++) {
        if ((h = hex(cur.charCodeAt(idx + 2 + k))) < 0) return s += cur[idx + 1], 2;
        cp = cp * 16 + h;
      }
      return s += String.fromCharCode(cp), 2 + w;
    }
    // \u{H...H}
    if (n === U) {
      let cp = 0, k = idx + 3, h;
      while ((h = hex(cur.charCodeAt(k))) >= 0) cp = cp * 16 + h, k++;
      if (k > idx + 3 && cp <= 0x10ffff && cur.charCodeAt(k) === RBRACE)
        return s += String.fromCodePoint(cp), k - idx + 1;
      return s += cur[idx + 1], 2;
    }
    return s += esc[cur[idx + 1]] || cur[idx + 1], 2;
  };

  // c - q is 0 at close, NaN at EOF — both falsy, terminating the loop.
  next(c => c - q && (c !== BSLASH ? (s += cur[idx], 1) : escape()));
  cur[idx] === qc ? skip() : err('Bad string');
  return [, s];
};

lookup[DQUOTE] = parseString(DQUOTE);
lookup[SQUOTE] = parseString(SQUOTE);
parse.string = { '"': true };

export { esc };
