/**
 * Control flow: if/else, while, for, break, continue, return
 * Parses to lispy AST:
 *   if (cond) body           → ['if', cond, body]
 *   if (cond) body else alt  → ['if', cond, body, alt]
 *   while (cond) body        → ['while', cond, body]
 *   for (init; cond; step) body → ['for', init, cond, step, body]
 *   break                    → ['break']
 *   continue                 → ['continue']
 *   return expr              → ['return', expr]
 */
import * as P from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_STATEMENT, OPAREN, CPAREN, PREC_SEQ, PREC_TOKEN } from '../src/const.js'

const { token, expr, skip, space, err, parse, next } = P

const SEMI = 59

// Control flow signals (thrown to break out of loops)
class Break { }
class Continue { }
class Return { constructor(v) { this.value = v } }

export const BREAK = new Break()
export const CONTINUE = new Continue()

// if (cond) body [else alt]
token('if', PREC_STATEMENT, (a, cond, body, alt) => {
  if (a) return // not prefix position
  space() === OPAREN || err('Expected (')
  skip()
  cond = expr(0, CPAREN)
  body = expr(PREC_STATEMENT)
  // check for else - need to check cur/idx via module namespace for live values
  alt = parseElse()
  return alt !== undefined ? ['if', cond, body, alt] : ['if', cond, body]
})

// helper: parse optional else (uses live idx/cur from module)
const parseElse = () => {
  space()
  // check if 'else' follows - use next to consume if matches
  if (next(c => P.cur.substr(P.idx, 4) === 'else' && !parse.id(P.cur.charCodeAt(P.idx + 4)) ? 4 : 0)) {
    return expr(PREC_STATEMENT)
  }
}

operator('if', (cond, body, alt) => {
  cond = compile(cond)
  body = compile(body)
  alt = alt !== undefined ? compile(alt) : null
  return ctx => cond(ctx) ? body(ctx) : (alt ? alt(ctx) : undefined)
})


// while (cond) body
token('while', PREC_STATEMENT, (a, cond, body) => {
  if (a) return // not prefix position
  space() === OPAREN || err('Expected (')
  skip()
  cond = expr(0, CPAREN)
  body = expr(PREC_STATEMENT)
  return ['while', cond, body]
})

operator('while', (cond, body) => {
  cond = compile(cond)
  body = compile(body)
  return ctx => {
    let result
    while (cond(ctx)) {
      try { result = body(ctx) }
      catch (e) {
        if (e === BREAK) break
        if (e === CONTINUE) continue
        if (e instanceof Return) return e.value
        throw e
      }
    }
    return result
  }
})


// for (init; cond; step) body
token('for', PREC_STATEMENT, (a, init, cond, step, body) => {
  if (a) return // not prefix position
  space() === OPAREN || err('Expected (')
  skip()
  // init; cond; step - separated by ;
  // each part can be empty
  init = space() === SEMI ? null : expr(PREC_SEQ)
  space() === SEMI ? skip() : err('Expected ;')
  cond = space() === SEMI ? null : expr(PREC_SEQ)
  space() === SEMI ? skip() : err('Expected ;')
  step = space() === CPAREN ? null : expr(PREC_SEQ)
  space() === CPAREN ? skip() : err('Expected )')
  body = expr(PREC_STATEMENT)
  return ['for', init, cond, step, body]
})

operator('for', (init, cond, step, body) => {
  init = init ? compile(init) : null
  cond = cond ? compile(cond) : () => true
  step = step ? compile(step) : null
  body = compile(body)
  return ctx => {
    let result
    for (init?.(ctx); cond(ctx); step?.(ctx)) {
      try { result = body(ctx) }
      catch (e) {
        if (e === BREAK) break
        if (e === CONTINUE) continue
        if (e instanceof Return) return e.value
        throw e
      }
    }
    return result
  }
})


// break
token('break', PREC_TOKEN, a => a ? null : ['break'])
operator('break', () => () => { throw BREAK })

// continue
token('continue', PREC_TOKEN, a => a ? null : ['continue'])
operator('continue', () => () => { throw CONTINUE })

// return [expr]
token('return', PREC_STATEMENT, (a, val) => {
  if (a) return // not prefix
  // optional return value - check if there's an expression following
  space()
  // peek: if next char is }, ;, or end - no value
  const c = P.cur.charCodeAt(P.idx)
  if (!c || c === 125 || c === 59) return ['return']
  val = expr(PREC_STATEMENT)
  return ['return', val]
})

operator('return', val => {
  val = val !== undefined ? compile(val) : null
  return ctx => { throw new Return(val ? val(ctx) : undefined) }
})
