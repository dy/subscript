/**
 * Template string interpolation: `a ${expr} b`
 * 
 * AST:
 *   `a ${x} b`  → ['`', [,'a '], 'x', [,' b']]
 */
import * as P from '../src/parse.js'
import { operator, compile } from '../src/compile.js'

const { lookup, skip, err, next, expr } = P
const BACKTICK = 96, DOLLAR = 36, OBRACE = 123, CBRACE = 125, BSLASH = 92

const escape = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v' }

// Parse template literal
lookup[BACKTICK] = a => {
  a && err('Unexpected template')
  skip() // consume opening `
  
  const parts = []
  let str = ''
  
  while (P.cur.charCodeAt(P.idx) !== BACKTICK) {
    const c = P.cur.charCodeAt(P.idx)
    if (!c) err('Unterminated template')
    
    // Escape sequence
    if (c === BSLASH) {
      skip()
      const ec = P.cur[P.idx]
      str += escape[ec] || ec
      skip()
    }
    // Interpolation ${...}
    else if (c === DOLLAR && P.cur.charCodeAt(P.idx + 1) === OBRACE) {
      if (str) parts.push([, str])
      str = ''
      skip(); skip() // consume ${
      parts.push(expr(0, CBRACE))
    }
    // Regular character
    else {
      str += P.cur[P.idx]
      skip()
    }
  }
  
  skip() // consume closing `
  if (str) parts.push([, str])
  
  // Optimize: if no interpolations, return plain string
  if (parts.length === 0) return [, '']
  if (parts.length === 1 && parts[0][0] === undefined) return parts[0]
  
  return ['`', ...parts]
}

// Compile template: concatenate parts
operator('`', (...parts) => {
  parts = parts.map(p => compile(p))
  return ctx => parts.map(p => p(ctx)).join('')
})
