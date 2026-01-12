import { lookup, next, err, skip } from "../src/parse.js"
import { cur, idx } from "../src/parse.js"
import { PERIOD, _0, _E, _e, _9 } from "../src/const.js"

// Char codes for prefixes
const _b = 98, _B = 66, _o = 111, _O = 79, _x = 120, _X = 88
const _a = 97, _f = 102, _A = 65, _F = 70

// parse decimal number (with optional exponent)
const num = (a, _) => [, (
  a = +next(c => (c === PERIOD) || (c >= _0 && c <= _9) || (c === _E || c === _e ? 2 : 0))
) != a ? err() : a]

// .1
lookup[PERIOD] = a => !a && num()

// 1-9 (non-zero starts decimal)
for (let i = _0 + 1; i <= _9; i++) lookup[i] = a => a ? err() : num()

// 0 - check for prefix (0b, 0o, 0x) or plain decimal
lookup[_0] = a => {
  if (a) return err()
  const nextChar = cur.charCodeAt(idx + 1)
  
  // Binary: 0b
  if (nextChar === _b || nextChar === _B) {
    skip(); skip() // consume '0b'
    const s = next(c => c === 48 || c === 49) // 0 or 1
    return [, parseInt(s, 2)]
  }
  // Octal: 0o
  if (nextChar === _o || nextChar === _O) {
    skip(); skip() // consume '0o'
    const s = next(c => c >= 48 && c <= 55) // 0-7
    return [, parseInt(s, 8)]
  }
  // Hex: 0x
  if (nextChar === _x || nextChar === _X) {
    skip(); skip() // consume '0x'
    const s = next(c => (c >= _0 && c <= _9) || (c >= _a && c <= _f) || (c >= _A && c <= _F))
    return [, parseInt(s, 16)]
  }
  
  return num()
}
