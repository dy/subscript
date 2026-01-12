/**
 * Control flow: if/else, while, for, break, continue, return, blocks
 *
 * AST:
 *   if (c) a else b    → ['if', c, a, b?]
 *   while (c) a        → ['while', c, a]
 *   for (i;c;s) a      → ['for', i, c, s, a]
 *   { a; b }           → ['block', [';', a, b]]
 *   break/continue     → ['break'] / ['continue']
 *   return x           → ['return', x?]
 */
import * as P from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_STATEMENT, OPAREN, CPAREN, OBRACE, CBRACE, PREC_SEQ, PREC_TOKEN } from '../src/const.js'

const { token, expr, skip, space, err, parse, next } = P
const SEMI = 59

// Control signals
class Break {}
class Continue {}
class Return { constructor(v) { this.value = v } }
export const BREAK = new Break(), CONTINUE = new Continue()

// Shared loop body executor
const loop = (body, ctx) => {
  try { return { val: body(ctx) } }
  catch (e) {
    if (e === BREAK) return { brk: 1 }
    if (e === CONTINUE) return { cnt: 1 }
    if (e instanceof Return) return { ret: 1, val: e.value }
    throw e
  }
}

// if (cond) body [else alt]
token('if', PREC_STATEMENT, a => {
  if (a) return
  space() === OPAREN || err('Expected (')
  skip()
  const cond = expr(0, CPAREN), body = parseBody()
  space()
  // check 'else' — skip 4 chars via skip() since P.idx is read-only from module
  const alt = P.cur.substr(P.idx, 4) === 'else' && !parse.id(P.cur.charCodeAt(P.idx + 4))
    ? (skip(), skip(), skip(), skip(), parseBody()) : undefined
  return alt !== undefined ? ['if', cond, body, alt] : ['if', cond, body]
})

operator('if', (cond, body, alt) => {
  cond = compile(cond); body = compile(body); alt = alt !== undefined ? compile(alt) : null
  return ctx => cond(ctx) ? body(ctx) : alt?.(ctx)
})

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

// Block parsing helper - only used by control structures
const parseBody = () => {
  if (space() === OBRACE) {
    skip() // consume {
    return ['block', expr(0, CBRACE)]
  }
  return expr(0)  // prec=0 to allow nested control structures
}

operator('block', body => {
  if (body === undefined) return () => {}
  body = compile(body)
  return ctx => body(Object.create(ctx)) // new scope
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
