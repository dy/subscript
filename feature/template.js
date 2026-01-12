/**
 * Template literals and tagged templates
 *
 * AST:
 *   `a ${x} b`      → ['`', [,'a '], 'x', [,' b']]
 *   tag`a ${x} b`   → ['``', 'tag', [,'a '], 'x', [,' b']]
 */
import * as P from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_ACCESS } from '../src/const.js'

const { skip, err, expr } = P
const BACKTICK = 96, DOLLAR = 36, OBRACE = 123, BSLASH = 92

const escape = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v' }

// Parse template body starting AFTER opening backtick
const parseTemplateBody = () => {
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
      parts.push(expr(0, OBRACE + 2)) // CBRACE = 125
    }
    // Regular character
    else {
      str += P.cur[P.idx]
      skip()
    }
  }

  skip() // consume closing `
  if (str) parts.push([, str])
  return parts
}

// Both plain and tagged templates handled via lookup
const prev = P.lookup[BACKTICK]
P.lookup[BACKTICK] = (a, prec) => {
  // Tagged template: tag`...`
  if (a && prec < PREC_ACCESS) {
    skip() // consume opening `
    return ['``', a, ...parseTemplateBody()]
  }

  // Plain template literal (no tag)
  if (!a) {
    skip() // consume opening `
    const parts = parseTemplateBody()

    // Optimize: if no interpolations, return plain string
    if (parts.length === 0) return [, '']
    if (parts.length === 1 && parts[0][0] === undefined) return parts[0]

    return ['`', ...parts]
  }

  return prev?.(a, prec)
}

// Compile plain template: concatenate parts
operator('`', (...parts) => {
  parts = parts.map(p => compile(p))
  return ctx => parts.map(p => p(ctx)).join('')
})

// Compile tagged template: call tag function with strings and values
operator('``', (tag, ...parts) => {
  tag = compile(tag)
  const strings = [], exprs = []
  for (const p of parts) {
    if (Array.isArray(p) && p[0] === undefined) strings.push(p[1])
    else exprs.push(compile(p))
  }
  // Create raw array (simplified - same as cooked for now)
  const strs = Object.assign([...strings], { raw: strings })
  return ctx => tag(ctx)(strs, ...exprs.map(e => e(ctx)))
})
