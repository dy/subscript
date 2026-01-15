/**
 * Strings with escape sequences
 *
 * Configurable via parse.string: '"' or '"\''
 */
import { parse, lookup, next, err, skip, idx, cur } from '../parse/pratt.js';

const BSLASH = 92;
const esc = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v' };

// Parse string with given quote char code
const parseString = q => (a, _, s = '') => {
  a && err('Unexpected string');
  skip();
  next(c => c - q && (c === BSLASH ? (s += esc[cur[idx + 1]] || cur[idx + 1], 2) : (s += cur[idx], 1)));
  cur[idx] === String.fromCharCode(q) ? skip() : err('Bad string');
  return [, s];
};

// Register quote chars
const register = s => { for (const c of s) lookup[c.charCodeAt(0)] = parseString(c.charCodeAt(0)); };

// Default: double quotes
parse.string = '"';
register(parse.string);

export { register as string, esc };
