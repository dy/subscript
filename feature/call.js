import { token, expr, err } from '../src/parse.js'
import { operator, compile, access } from '../src/compile.js'
import { CBRACK, CPAREN, PREC_ACCESS } from '../src/const.js'

// a(b,c,d), a()
token('(', PREC_ACCESS, (a, b) => a && (b = expr(0, CPAREN), b ? ['(', a, b] : ['(', a, '']))
operator('(', (a, b, path, container, args) => (
  args = b == '' ? () => [] : // a()
    b[0] === ',' ? (b = b.slice(1).map(compile), ctx => b.map(arg => arg(ctx))) : // a(b,c)
      (b = compile(b), ctx => [b(ctx)]), // a(b)

  access(a,
    // a(...args)
    (_, path, ctx) => ctx[path](...args(ctx)),
    // a.b(...args)
    (obj, path, ctx) => obj(ctx)[path](...args(ctx)),
    // a[b](...args)
    (obj, path, ctx) => obj(ctx)[path(ctx)](...args(ctx)),
    // (a,b,c)(...args)
    (src, _, ctx) => src(ctx)(...args(ctx))
  )
)
)
