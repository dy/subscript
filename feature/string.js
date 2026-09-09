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

// Read a numeric escape without changing parser state.
const escapePoint = start => {
  if (cur.charCodeAt(start) !== BSLASH) return;
  const n = cur.charCodeAt(start + 1);
  if (n === X || (n === U && cur.charCodeAt(start + 2) !== LBRACE)) {
    const w = n === X ? 2 : 4;
    let cp = 0, h;
    for (let k = 0; k < w; k++) {
      if ((h = hex(cur.charCodeAt(start + 2 + k))) < 0) return;
      cp = cp * 16 + h;
    }
    return [cp, 2 + w];
  }
  if (n === U) {
    let cp = 0, k = start + 3, h;
    while ((h = hex(cur.charCodeAt(k))) >= 0) cp = cp * 16 + h, k++;
    if (k > start + 3 && cp <= 0x10ffff && cur.charCodeAt(k) === RBRACE)
      return [cp, k - start + 1];
  }
};

// Decode one escape (or an adjacent surrogate pair). Shared with templates.
// Pair before constructing text so Unicode encoders see one scalar value.
const decodeEscape = () => {
  const n = cur.charCodeAt(idx + 1);
  if (n === LF) return ['', 2];
  if (n === CR) return ['', cur.charCodeAt(idx + 2) === LF ? 3 : 2];
  const p = escapePoint(idx);
  if (p) {
    let [cp, w] = p;
    if (cp >= 0xD800 && cp <= 0xDBFF) {
      const q = escapePoint(idx + w);
      if (q && q[0] >= 0xDC00 && q[0] <= 0xDFFF) {
        cp = 0x10000 + (cp - 0xD800) * 1024 + q[0] - 0xDC00;
        w += q[1];
      }
    }
    return [String.fromCodePoint(cp), w];
  }
  return [esc[cur[idx + 1]] || cur[idx + 1], 2];
};

// `s` is the closed-over accumulator shared with the escape handler.
const parseString = q => (a, _, s = '', qc = String.fromCharCode(q)) => {
  if (a || !parse.string?.[qc]) return;
  skip();

  const escape = () => { const [t, w] = decodeEscape(); s += t; return w; };

  // c - q is 0 at close, NaN at EOF — both falsy, terminating the loop.
  next(c => c - q && (c !== BSLASH ? (s += cur[idx], 1) : escape()));
  cur[idx] === qc ? skip() : err('Bad string');
  return [, s];
};

lookup[DQUOTE] = parseString(DQUOTE);
lookup[SQUOTE] = parseString(SQUOTE);
parse.string = { '"': true };

export { esc, decodeEscape };
