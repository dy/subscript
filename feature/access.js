import { token, expr, err } from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { CBRACK, CPAREN, PREC_ACCESS } from '../src/const.js'

// a[b]
token('[', PREC_ACCESS, a => a && ['[', a, expr(0, CBRACK) || err()])
operator('[', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx)[b(ctx)]))

// a.b
token('.', PREC_ACCESS, (a, b) => a && (b = expr(PREC_ACCESS)) && ['.', a, b])
operator('.', (a, b) => (a = compile(a), b = !b[0] ? b[1] : b, ctx => a(ctx)[b])) // a.true, a.1 → needs to work fine

// a(b,c,d), a()
token('(', PREC_ACCESS, (a, b) => a && (b = expr(0, CPAREN), b ? ['(', a, b] : ['(', a, '']))
operator('(', (a, b, path, container, args) => (
  args = b == '' ? () => [] : // a()
    b[0] === ',' ? (b = b.slice(1).map(compile), ctx => b.map(arg => arg(ctx))) : // a(b,c)
      (b = compile(b), ctx => [b(ctx)]), // a(b)

  a[0] === '.' ? (path = a[2], a = compile(a[1]), ctx => a(ctx)[path](...args(ctx))) : // a.b(...args)
    a[0] === '[' ? (path = compile(a[2]), a = compile(a[1]), ctx => a(ctx)[path(ctx)](...args(ctx))) : // a[b](...args)
      (a = compile(a), ctx => a(ctx)(...args(ctx))) // a(...args)
)
)
