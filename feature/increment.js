import { token, expr } from "../src/parse.js"
import { operator, compile, prop } from "../src/compile.js"
import { PREC_POSTFIX } from "../src/const.js"

let inc, dec
token('++', PREC_POSTFIX, a => a ? ['++-', a] : ['++', expr(PREC_POSTFIX - 1)])
// ++a, ++((a)), ++a.b, ++a[b]
operator('++', inc = (a) => prop(a, (obj, path, ctx) => ++obj[path]))
operator('++-', inc = (a) => prop(a, (obj, path, ctx) => obj[path]++))

token('--', PREC_POSTFIX, a => a ? ['--+', a] : ['--', expr(PREC_POSTFIX - 1)])
// --a, --a.b, --a[b]
operator('--', dec = (a) => (prop(a, (obj, path, ctx) => --obj[path])))
operator('--+', dec = (a) => (prop(a, (obj, path, ctx) => obj[path]--)))
