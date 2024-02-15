import { token, expr, err } from '../src/parse.js'
import { compile, operator } from '../src/compile.js'
import { set } from '../src/index.js'
import { CPAREN, PREC_ACCESS, PREC_GROUP, PREC_SEQ } from '../src/const.js'

// (a,b,c), (a)
// FIXME: try raising group precedence (it causes conflict in ?. though)
token('(', PREC_ACCESS, (a, b) => (!a && ['()', expr(0, CPAREN) || err('Empty group')]))
operator('()', (a) => (compile(a)))
set(',', PREC_SEQ, (...args) => args[args.length - 1])
