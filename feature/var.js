/**
 * Variable declarations: let, const
 * 
 * AST:
 *   let x       → ['let', 'x']
 *   let x = 1   → ['let', 'x', val]
 *   const x = 1 → ['const', 'x', val]
 */
import * as P from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_STATEMENT } from '../src/const.js'

const { token, expr, skip, space, err, parse, next } = P

// let x [= val]
token('let', PREC_STATEMENT, a => {
  if (a) return
  space()
  const name = next(parse.id)
  if (!name) err('Expected identifier')
  space()
  if (P.cur.charCodeAt(P.idx) === 61 && P.cur.charCodeAt(P.idx + 1) !== 61) {
    skip()
    return ['let', name, expr(PREC_STATEMENT)]
  }
  return ['let', name]
})

operator('let', (name, val) => {
  val = val !== undefined ? compile(val) : null
  return ctx => { ctx[name] = val ? val(ctx) : undefined }
})

// const x = val
token('const', PREC_STATEMENT, a => {
  if (a) return
  space()
  const name = next(parse.id)
  if (!name) err('Expected identifier')
  space()
  P.cur.charCodeAt(P.idx) === 61 && P.cur.charCodeAt(P.idx + 1) !== 61 || err('Expected =')
  skip()
  return ['const', name, expr(PREC_STATEMENT)]
})

operator('const', (name, val) => {
  val = compile(val)
  return ctx => { ctx[name] = val(ctx) }
})
