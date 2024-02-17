import { err, nary, group } from '../src/parse.js'
import { compile, operator } from '../src/compile.js'
import { PREC_ACCESS, PREC_GROUP, PREC_SEQ } from '../src/const.js'

// (a,b,c), (a)
// FIXME: try raising group precedence (it causes conflict in ?. though)
group('()', PREC_ACCESS)
operator('()', (a) => (!a && err('Empty ()'), compile(a)))

const last = (...args) => (args = args.map(compile), ctx => args.map(arg => arg(ctx)).pop())
nary(',', PREC_SEQ), operator(',', last)
nary(';', PREC_SEQ, true), operator(';', last)
