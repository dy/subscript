import { token, expr } from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_ACCESS } from '../src/const.js'

// a?.[, a?.( - postfix operator
token('?.', PREC_ACCESS, a => a && ['?.', a])
// a ?.
operator('?.', a => (a = compile(a), ctx => a(ctx) || (() => { })))

// a?.b, a?.() - optional chain operator
token('?.', PREC_ACCESS, (a, b) => a && (b = expr(PREC_ACCESS), !b?.map) && ['?.', a, b])
// a ?. b
operator('?.', (a, b) => b && (a = compile(a), ctx => a(ctx)?.[b]))

// a?.x() - keep context, but watch out a?.()
operator('(', (a, b, container, args, path, optional) => (a[0] === '?.') && (a[2] || Array.isArray(a[1])) && (
  args = !b ? () => [] : // a()
    b[0] === ',' ? (b = b.slice(1).map(compile), ctx => b.map(a => a(ctx))) : // a(b,c)
      (b = compile(b), ctx => [b(ctx)]), // a(b)

  // a?.()
  !a[2] && (optional = true, a = a[1]),

  // a?.['x']?.()
  a[0] === '[' ? (path = compile(a[2])) : (path = () => a[2]),
  (container = compile(a[1]), optional ?
    ctx => (container(ctx)?.[path(ctx)]?.(...args(ctx))) :
    ctx => (container(ctx)?.[path(ctx)](...args(ctx)))
  )
))
