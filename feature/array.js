import { token, expr, group } from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_TOKEN } from '../src/const.js'

// [a,b,c]
group('[]', PREC_TOKEN)
operator('[]', (a, b) => (
  a = !a ? [] : a[0] === ',' ? a.slice(1) : [a],
  a = a.map(a => a[0] === '...' ? (a = compile(a[1]), ctx => a(ctx)) : (a = compile(a), ctx => [a(ctx)])),
  ctx => a.flatMap(a => (a(ctx))))
)
