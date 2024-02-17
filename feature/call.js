import { access } from '../src/parse.js'
import { operator, compile, prop } from '../src/compile.js'
import { PREC_ACCESS } from '../src/const.js'

// a(b,c,d), a()
access('()', PREC_ACCESS)
operator('(', (a, b, args) => (
  args = !b ? () => [] : // a()
    b[0] === ',' ? (b = b.slice(1).map(b => !b ? err() : compile(b)), ctx => b.map(arg => arg(ctx))) : // a(b,c)
      (b = compile(b), ctx => [b(ctx)]), // a(b)

  // a(...args), a.b(...args), a[b](...args)
  prop(a, (obj, path, ctx) => obj(ctx)[path(ctx)](...args(ctx)), true)
)
)
