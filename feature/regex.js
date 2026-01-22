/**
 * Regex literals: /pattern/flags
 *
 * AST (constructor form, JSON-serializable):
 *   /abc/gi  → ['//', 'abc', 'gi']
 *   /abc/    → ['//', 'abc']
 *
 * Note: Disambiguates from division by context:
 *   - `/` after value = division (falls through to prev)
 *   - `/` at start or after operator = regex
 *
 * Compile:
 *   ['//', 'abc', 'gi']  → new RegExp('abc', 'gi')
 */
import { token, skip, err, next, idx, cur, operator } from '../parse.js';

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

  const flags = next(regexFlag);
  // Validate regex syntax
  try { new RegExp(pattern, flags); }
  catch (e) { err('Invalid regex: ' + e.message); }

  return flags ? ['//', pattern, flags] : ['//', pattern];
});

// Compile: ['//', pattern, flags?] → RegExp
operator('//', (a, b) => {
  const re = new RegExp(a, b || '');
  return () => re;
});
