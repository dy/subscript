import { token, expr, err, nary } from '../src/parse.js'
import { compile, operator } from '../src/compile.js'
import { CPAREN, PREC_ACCESS, PREC_GROUP, PREC_SEQ } from '../src/const.js'

// (a,b,c), (a)
// FIXME: try raising group precedence (it causes conflict in ?. though)
token('(', PREC_ACCESS, (a) => (!a && ['()', expr(0, CPAREN) || err('Empty group')]))
operator('()', (a) => (compile(a)))

const last = (...args) => (args = args.map(compile), ctx => args.map(arg => arg(ctx)).pop())
nary(',', PREC_SEQ), operator(',', last)
nary(';', PREC_SEQ, true), operator(';', last)
