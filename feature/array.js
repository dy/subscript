import { token, expr } from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { CBRACK, PREC_TOKEN } from '../src/const.js'

// [a,b,c]
token('[', PREC_TOKEN, (a) => !a && ['[', expr(0, CBRACK) || ''])
operator('[', (a, b) => !b && (
  !a ? () => [] : // []
    a[0] === ',' ? (a = a.slice(1).map(compile), ctx => a.map(a => a(ctx))) : // [a,b,c]
      (a = compile(a), ctx => [a(ctx)]) // [a]
))
