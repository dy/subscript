/**
 * Literal values: numbers and strings
 *
 * Numbers: 1, 1.5, 1e3, 0b101, 0o17, 0xFF
 * Strings: "abc", 'xyz'
 */
import { lookup, next, err, skip, idx, cur } from '../src/parse.js'
import { PERIOD, _0, _E, _e, _9, DQUOTE, QUOTE, BSLASH } from "../src/const.js"

// === Numbers ===

const _b = 98, _B = 66, _o = 111, _O = 79, _x = 120, _X = 88
const _a = 97, _f = 102, _A = 65, _F = 70
const PLUS = 43, MINUS = 45

const isExpFollow = off => {
  const c = cur.charCodeAt(idx + off)
  return (c >= _0 && c <= _9) || c === PLUS || c === MINUS
}

const num = (a, _) => [, (
  a = +next(c => (c === PERIOD) || (c >= _0 && c <= _9) || ((c === _E || c === _e) && isExpFollow(1) ? 2 : 0))
) != a ? err() : a]

// .1
lookup[PERIOD] = a => !a && num()

// 1-9
for (let i = _0 + 1; i <= _9; i++) lookup[i] = a => a ? err() : num()

// 0 with prefix check (0b, 0o, 0x)
lookup[_0] = a => {
  if (a) return err()
  const nextChar = cur.charCodeAt(idx + 1)

  if (nextChar === _b || nextChar === _B) {
    skip(); skip()
    return [, parseInt(next(c => c === 48 || c === 49), 2)]
  }
  if (nextChar === _o || nextChar === _O) {
    skip(); skip()
    return [, parseInt(next(c => c >= 48 && c <= 55), 8)]
  }
  if (nextChar === _x || nextChar === _X) {
    skip(); skip()
    return [, parseInt(next(c => (c >= _0 && c <= _9) || (c >= _a && c <= _f) || (c >= _A && c <= _F)), 16)]
  }

  return num()
}

// === Strings ===

const escape = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v' }

const string = q => (qc, prec, str = '') => {
  qc && err('Unexpected string')
  skip()
  next(c => c - q && (c === BSLASH ? (str += escape[cur[idx + 1]] || cur[idx + 1], 2) : (str += cur[idx], 1)))
  skip() || err('Bad string')
  return [, str]
}

lookup[DQUOTE] = string(DQUOTE)
lookup[QUOTE] = string(QUOTE)
