import { token, expr, group, binary } from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_ASSIGN, PREC_SEQ, PREC_TOKEN } from '../src/const.js'


// {a:1, b:2, c:3}
group('{}', PREC_TOKEN)
operator('{}', (a, b) => (
  !a ? () => ({}) : // {}
    a[0] === ',' ? (a = a.slice(1).map(compile), ctx => Object.fromEntries(a.map(a => a(ctx)))) : // {a:1,b:2}
      a[0] === ':' ? (a = compile(a), ctx => Object.fromEntries([a(ctx)])) : // {a:1}
        (b = compile(a), ctx => ({ [a]: b(ctx) }))
))

// FIXME: mb we don't need this seq raise
// token(':', PREC_ASSIGN, (a, b) => (b = expr(PREC_SEQ) || err(), [':', a, b]))
binary(':', PREC_ASSIGN, true)
operator(':', (a, b) => (b = compile(b), a = Array.isArray(a) ? compile(a) : (a => a).bind(0, a), ctx => [a(ctx), b(ctx)]))
