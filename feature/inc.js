import { token, expr } from "../src/parse.js"
import { operator, compile, access } from "../src/compile.js"
import { PREC_POSTFIX } from "../src/const.js"

let inc, dec
token('++', PREC_POSTFIX, a => a ? ['-', ['++', a], [, 1]] : ['++', expr(PREC_POSTFIX - 1)])
operator('++', inc = (a, b) =>
  access(a,
    // ++a, ++((a))
    (_, path, ctx) => ++ctx[path],
    // ++a.b
    (obj, path, ctx) => ++obj(ctx)[path],
    // ++a[b]
    (obj, path, ctx) => ++obj(ctx)[path(ctx)]
  )
)

token('--', PREC_POSTFIX, a => a ? ['+', ['--', a], [, 1]] : ['--', expr(PREC_POSTFIX - 1)])
operator('--', dec = (a, b) => (
  // --a, --a.b, --a[b]
  access(a, (_, path, ctx) => --ctx[path], (obj, path, ctx) => --obj(ctx)[path], (obj, path, ctx) => --obj(ctx)[path(ctx)])
))
