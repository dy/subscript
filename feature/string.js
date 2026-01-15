/**
 * Strings with escape sequences
 *
 * Configurable via parse.string: { '"': true } or { '"': true, "'": true }
 */
import { parse, lookup, next, err, skip, idx, cur } from '../parse/pratt.js';

const BSLASH = 92, DQUOTE = 34, SQUOTE = 39;
const esc = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v' };

// Parse string with given quote char code
const parseString = q => (a, _, s = '') => {
  if (a || !parse.string?.[String.fromCharCode(q)]) return;
  skip();
  next(c => c - q && (c === BSLASH ? (s += esc[cur[idx + 1]] || cur[idx + 1], 2) : (s += cur[idx], 1)));
  cur[idx] === String.fromCharCode(q) ? skip() : err('Bad string');
  return [, s];
};

// Register both quote chars (enabled via parse.string config)
lookup[DQUOTE] = parseString(DQUOTE);
lookup[SQUOTE] = parseString(SQUOTE);

// Default: double quotes only
parse.string = { '"': true };

export { esc };
