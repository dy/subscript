/**
 * Regex literals: /pattern/flags
 *
 * AST:
 *   /abc/gi  → [, /abc/gi]
 *
 * Note: Disambiguates from division by context:
 *   - `/` after value = division
 *   - `/` at start or after operator = regex
 */
import { lookup, skip, err, next, idx, cur } from '../src/parse.js'

const SLASH = 47, BSLASH = 92

const regexFlags = c => c === 103 || c === 105 || c === 109 || c === 115 || c === 117 || c === 121 // g i m s u y

// Store original division handler
const divHandler = lookup[SLASH]

// Override / to detect regex vs division
lookup[SLASH] = (a, prec) => {
  // If there's a left operand, it's division
  if (a) return divHandler?.(a, prec)

  // No left operand = regex literal
  skip() // consume opening /

  let pattern = '', c
  while ((c = cur.charCodeAt(idx)) && c !== SLASH) {
    if (c === BSLASH) {
      pattern += cur[idx]; skip()
      if (!cur[idx]) err('Unterminated regex')
      pattern += cur[idx]; skip()
    } else {
      pattern += cur[idx]; skip()
    }
  }

  if (!cur[idx]) err('Unterminated regex')
  skip() // consume closing /

  // Parse flags
  const flags = next(regexFlags)

  try {
    return [, new RegExp(pattern, flags)]
  } catch (e) {
    err('Invalid regex: ' + e.message)
  }
}
