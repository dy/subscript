import { token, expr, group } from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_TOKEN } from '../src/const.js'

// [a,b,c]
group('[]', PREC_TOKEN)
operator('[]', (a, b) => (
  !a ? () => [] : // []
    a[0] === ',' ? (a = a.slice(1).map(compile), ctx => a.map(a => a(ctx))) : // [a,b,c]
      (a = compile(a), ctx => [a(ctx)]) // [a]
))
