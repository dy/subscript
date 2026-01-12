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

const { token, expr, skip, space, err } = P
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
token('for', PREC_STATEMENT, a => {
  if (a) return
  space() === OPAREN || err('Expected (')
  skip()
  const init = space() === SEMI ? null : expr(PREC_SEQ)
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
