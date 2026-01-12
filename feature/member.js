/**
 * Property access and function calls: a.b, a[b], a(b)
 */
import { access, binary, err } from '../src/parse.js'
import { operator, compile, prop } from '../src/compile.js'
import { PREC_ACCESS, unsafe } from '../src/const.js'

// a[b]
access('[]', PREC_ACCESS)
operator('[]', (a, b) => !b ? err() : (a = compile(a), b = compile(b), ctx => { const k = b(ctx); return unsafe(k) ? undefined : a(ctx)[k] }))

// a.b
binary('.', PREC_ACCESS)
operator('.', (a, b) => (a = compile(a), b = !b[0] ? b[1] : b, unsafe(b) ? () => undefined : ctx => a(ctx)[b]))

// a(b,c,d), a()
access('()', PREC_ACCESS)
operator('()', (a, b, args) => b !== undefined && (
  args = !b ? () => [] :
    b[0] === ',' ? (b = b.slice(1).map(b => !b ? err() : compile(b)), ctx => b.map(arg => arg(ctx))) :
      (b = compile(b), ctx => [b(ctx)]),
  prop(a, (obj, path, ctx) => obj[path](...args(ctx)), true)
))
