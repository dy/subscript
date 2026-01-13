/**
 * Variable declarations: let, const
 *
 * AST:
 *   let x       → ['let', 'x']
 *   let x = 1   → ['let', 'x', val]
 *   const x = 1 → ['const', 'x', val]
 */
import { token, expr, skip, space, err, parse, next, idx, cur } from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_STATEMENT } from '../src/const.js'

const EQ = 61

// let x [= val]
token('let', PREC_STATEMENT, a => {
  if (a) return
  space()
  const name = next(parse.id)
  if (!name) err('Expected identifier')
  space()
  if (cur.charCodeAt(idx) === EQ && cur.charCodeAt(idx + 1) !== EQ) {
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
  cur.charCodeAt(idx) === EQ && cur.charCodeAt(idx + 1) !== EQ || err('Expected =')
  skip()
  return ['const', name, expr(PREC_STATEMENT)]
})

operator('const', (name, val) => {
  val = compile(val)
  return ctx => { ctx[name] = val(ctx) }
})
