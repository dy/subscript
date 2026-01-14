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
import { token, skip, err, next, idx, cur } from '../src/parse.js';
import { PREC_PREFIX } from '../src/const.js';

const SLASH = 47, BSLASH = 92;

const regexFlags = c => c === 103 || c === 105 || c === 109 || c === 115 || c === 117 || c === 121; // g i m s u y

// Register / as prefix operator for regex
token('/', PREC_PREFIX, a => {
  if (a) return; // has left operand = not regex, fall through

  // Invalid regex start (quantifiers) or /= operator - fall through
  const first = cur.charCodeAt(idx);
  if (first === SLASH || first === 42 || first === 43 || first === 63 || first === 61) return;

  // Parse regex pattern
  let pattern = '', c;
  while ((c = cur.charCodeAt(idx)) && c !== SLASH) {
    if (c === BSLASH) {
      pattern += cur[idx]; skip();
      if (!cur[idx]) err('Unterminated regex');
      pattern += cur[idx]; skip();
    } else {
      pattern += cur[idx]; skip();
    }
  }

  if (!cur[idx]) err('Unterminated regex');
  skip(); // consume closing /

  const flags = next(regexFlags);

  try {
    return [, new RegExp(pattern, flags)];
  } catch (e) {
    err('Invalid regex: ' + e.message);
  }
});
