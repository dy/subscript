/**
 * Regex literals: /pattern/flags
 *
 * AST:
 *   /abc/gi  → [, /abc/gi]
 *
 * Note: Disambiguates from division by context:
 *   - `/` after value = division (falls through to prev)
 *   - `/` at start or after operator = regex
 */
import { token, skip, err, next, idx, cur } from '../parse/pratt.js';

const PREFIX = 140, SLASH = 47, BSLASH = 92;

const regexChar = c => c === BSLASH ? 2 : c && c !== SLASH;  // \x = 2 chars, else 1 until /
const regexFlag = c => c === 103 || c === 105 || c === 109 || c === 115 || c === 117 || c === 121; // g i m s u y

token('/', PREFIX, a => {
  if (a) return; // has left operand = division, fall through

  // Invalid regex start (quantifiers) or /= - fall through
  const first = cur.charCodeAt(idx);
  if (first === SLASH || first === 42 || first === 43 || first === 63 || first === 61) return;

  const pattern = next(regexChar);
  cur.charCodeAt(idx) === SLASH || err('Unterminated regex');
  skip(); // consume closing /

  try { return [, new RegExp(pattern, next(regexFlag))]; }
  catch (e) { err('Invalid regex: ' + e.message); }
});
