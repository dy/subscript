import { token, expr } from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_ASSIGN, COLON } from '../src/const.js'

// ?:
token('?', PREC_ASSIGN, (a, b, c) => a && (b = expr(PREC_ASSIGN, COLON)) && (c = expr(PREC_ASSIGN + 1), ['?', a, b, c]))
operator('?', (a, b, c) => (a = compile(a), b = compile(b), c = compile(c), ctx => a(ctx) ? b(ctx) : c(ctx)))
