/**
 * Strings (universal): "hello" with \n\r\t\b\f\v escapes
 * 
 * Minimal portable string format: double-quote only.
 * For single quotes, import c/string.js
 */
import { lookup, next, err, skip, idx, cur } from '../parse/pratt.js';

const DQUOTE = 34, BSLASH = 92;
const esc = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v' };

const string = q => (a, _, s = '') => {
  a && err('Unexpected string');
  skip();
  next(c => c - q && (c === BSLASH ? (s += esc[cur[idx + 1]] || cur[idx + 1], 2) : (s += cur[idx], 1)));
  cur[idx] === String.fromCharCode(q) ? skip() : err('Bad string');
  return [, s];
};

lookup[DQUOTE] = string(DQUOTE);

// Export for c/string.js to reuse
export { string, esc };
