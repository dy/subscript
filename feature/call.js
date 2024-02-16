import { token, expr, err } from '../src/parse.js'
import { operator, compile, access } from '../src/compile.js'
import { CBRACK, CPAREN, PREC_ACCESS } from '../src/const.js'

// a(b,c,d), a()
token('(', PREC_ACCESS, (a, b) => a && (b = expr(0, CPAREN), b ? ['(', a, b] : ['(', a, '']))
operator('(', (a, b, args) => (
  args = b == '' ? () => [] : // a()
    b[0] === ',' ? (b = b.slice(1).map(compile), ctx => b.map(arg => arg(ctx))) : // a(b,c)
      (b = compile(b), ctx => [b(ctx)]), // a(b)

  // a(...args), a.b(...args), a[b](...args)
  access(a, (obj, path, ctx) => obj(ctx)[path(ctx)](...args(ctx)), true)
)
)
