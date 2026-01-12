/**
 * Conditionals: if/else
 *
 * AST:
 *   if (c) a else b    → ['if', c, a, b?]
 */
import * as P from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_STATEMENT, OPAREN, CPAREN, OBRACE, CBRACE } from '../src/const.js'

const { token, expr, skip, space, err, parse } = P

// Block parsing helper
const parseBody = () => {
  if (space() === OBRACE) {
    skip()
    return ['block', expr(0, CBRACE)]
  }
  return expr(0)
}

operator('block', body => {
  if (body === undefined) return () => {}
  body = compile(body)
  return ctx => body(Object.create(ctx))
})

// if (cond) body [else alt]
token('if', PREC_STATEMENT, a => {
  if (a) return
  space() === OPAREN || err('Expected (')
  skip()
  const cond = expr(0, CPAREN), body = parseBody()
  space()
  const alt = P.cur.substr(P.idx, 4) === 'else' && !parse.id(P.cur.charCodeAt(P.idx + 4))
    ? (skip(), skip(), skip(), skip(), parseBody()) : undefined
  return alt !== undefined ? ['if', cond, body, alt] : ['if', cond, body]
})

operator('if', (cond, body, alt) => {
  cond = compile(cond); body = compile(body); alt = alt !== undefined ? compile(alt) : null
  return ctx => cond(ctx) ? body(ctx) : alt?.(ctx)
})
