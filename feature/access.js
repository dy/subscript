import { token, expr, err } from '../src/parse.js'
import { operator, compile, access } from '../src/compile.js'
import { CBRACK, CPAREN, PREC_ACCESS } from '../src/const.js'

// a[b]
token('[', PREC_ACCESS, a => a && ['[', a, expr(0, CBRACK) || err()])
operator('[', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx)[b(ctx)]))

// a.b
token('.', PREC_ACCESS, (a, b) => a && (b = expr(PREC_ACCESS)) && ['.', a, b])
operator('.', (a, b) => (a = compile(a), b = !b[0] ? b[1] : b, ctx => a(ctx)[b])) // a.true, a.1 → needs to work fine
