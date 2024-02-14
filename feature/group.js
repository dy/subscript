import { token, expr, err } from '../src/parse.js'
import { compile, operator } from '../src/compile.js'
import { set } from '../src/index.js'
import { CPAREN, PREC_GROUP, PREC_SEQ } from '../src/const.js'

// (a,b,c), (a)
token('(', PREC_GROUP, a => !a && ['()', expr(0, CPAREN) || err()])
operator('()', compile)
set(',', PREC_SEQ, (...args) => args[args.length - 1])
