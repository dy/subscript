import { token, expr } from "../src/parse.js"
import { operator, compile, prop } from "../src/compile.js"
import { PREC_POSTFIX } from "../src/const.js"

token('++', PREC_POSTFIX, a => a ? ['++', a, null,] : ['++', expr(PREC_POSTFIX - 1)])
// ++a, ++((a)), ++a.b, ++a[b]
operator('++', (a,b) => prop(a, b === null ? (obj, path) => obj[path]++ : (obj, path) => ++obj[path]))

token('--', PREC_POSTFIX, a => a ? ['--', a, null,] : ['--', expr(PREC_POSTFIX - 1)])
// --a, --a.b, --a[b]
operator('--', (a, b) => prop(a, b === null ? (obj, path) => obj[path]-- : (obj, path) => --obj[path]))
