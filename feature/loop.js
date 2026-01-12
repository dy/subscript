/**
 * Loops: while, for, break, continue, return
 *
 * AST:
 *   while (c) a        → ['while', c, a]
 *   for (i;c;s) a      → ['for', i, c, s, a]
 *   break/continue     → ['break'] / ['continue']
 *   return x           → ['return', x?]
 */
import * as P from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_STATEMENT, OPAREN, CPAREN, CBRACE, PREC_SEQ, PREC_TOKEN } from '../src/const.js'
import { parseBody, loop, BREAK, CONTINUE, Return_ as Return } from './block.js'
export { BREAK, CONTINUE } from './block.js'

const { token, expr, skip, space, err, next, parse } = P
const SEMI = 59

// while (cond) body
token('while', PREC_STATEMENT, a => {
  if (a) return
  space() === OPAREN || err('Expected (')
  skip()
  return ['while', expr(0, CPAREN), parseBody()]
})

operator('while', (cond, body) => {
  cond = compile(cond); body = compile(body)
  return ctx => {
    let r, res
    while (cond(ctx)) {
      r = loop(body, ctx)
      if (r.brk) break
      if (r.cnt) continue
      if (r.ret) return r.val
      res = r.val
    }
    return res
  }
})

// for (init; cond; step) body
// Note: init supports both expressions AND let/const declarations
token('for', PREC_STATEMENT, a => {
  if (a) return
  space() === OPAREN || err('Expected (')
  skip()
  // Parse init: can be expression (PREC_SEQ) or let/const declaration (PREC_STATEMENT)
  // Using expr(PREC_SEQ) excludes statement-level tokens like let/const
  // So we detect let/const keywords and parse the declaration inline
  let init
  const cc = space()
  if (cc === SEMI) init = null
  else if (cc === 108 && P.cur.substr(P.idx, 3) === 'let' && !parse.id(P.cur.charCodeAt(P.idx + 3))) {
    skip(); skip(); skip() // skip 'let'
    space()
    const name = next(parse.id)
    if (!name) err('Expected identifier')
    space()
    if (P.cur.charCodeAt(P.idx) === 61 && P.cur.charCodeAt(P.idx + 1) !== 61) {
      skip(); init = ['let', name, expr(PREC_SEQ)]
    } else init = ['let', name]
  } else if (cc === 99 && P.cur.substr(P.idx, 5) === 'const' && !parse.id(P.cur.charCodeAt(P.idx + 5))) {
    skip(); skip(); skip(); skip(); skip() // skip 'const'
    space()
    const name = next(parse.id)
    if (!name) err('Expected identifier')
    space()
    P.cur.charCodeAt(P.idx) === 61 && P.cur.charCodeAt(P.idx + 1) !== 61 || err('Expected =')
    skip(); init = ['const', name, expr(PREC_SEQ)]
  } else init = expr(PREC_SEQ)
  space() === SEMI ? skip() : err('Expected ;')
  const cond = space() === SEMI ? null : expr(PREC_SEQ)
  space() === SEMI ? skip() : err('Expected ;')
  const step = space() === CPAREN ? null : expr(PREC_SEQ)
  space() === CPAREN ? skip() : err('Expected )')
  return ['for', init, cond, step, parseBody()]
})

operator('for', (init, cond, step, body) => {
  init = init ? compile(init) : null
  cond = cond ? compile(cond) : () => true
  step = step ? compile(step) : null
  body = compile(body)
  return ctx => {
    let r, res
    for (init?.(ctx); cond(ctx); step?.(ctx)) {
      r = loop(body, ctx)
      if (r.brk) break
      if (r.cnt) continue
      if (r.ret) return r.val
      res = r.val
    }
    return res
  }
})

// break / continue / return
token('break', PREC_TOKEN, a => a ? null : ['break'])
operator('break', () => () => { throw BREAK })

token('continue', PREC_TOKEN, a => a ? null : ['continue'])
operator('continue', () => () => { throw CONTINUE })

token('return', PREC_STATEMENT, a => {
  if (a) return
  space()
  const c = P.cur.charCodeAt(P.idx)
  if (!c || c === CBRACE || c === SEMI) return ['return']
  return ['return', expr(PREC_STATEMENT)]
})

operator('return', val => {
  val = val !== undefined ? compile(val) : null
  return ctx => { throw new Return(val?.(ctx)) }
})
