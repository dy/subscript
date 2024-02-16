import { token, expr } from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { CBRACE, PREC_SEQ, PREC_TOKEN } from '../src/const.js'


// {a:1, b:2, c:3}
token('{', PREC_TOKEN, a => !a && (['{', expr(0, CBRACE) || '']))
operator('{', (a, b) => (
  !a ? ctx => ({}) : // {}
    a[0] === ',' ? (a = a.slice(1).map(compile), ctx => Object.fromEntries(a.map(a => a(ctx)))) : // {a:1,b:2}
      a[0] === ':' ? (a = compile(a), ctx => Object.fromEntries([a(ctx)])) : // {a:1}
        (b = compile(a), ctx => ({ [a]: b(ctx) }))
))

// FIXME: mb we don't need this seq raise
token(':', PREC_SEQ + 0.1, (a, b) => (b = expr(PREC_SEQ + 0.1) || err(), [':', a, b]))
operator(':', (a, b) => (b = compile(b), a = Array.isArray(a) ? compile(a) : (a => a).bind(0, a), ctx => [a(ctx), b(ctx)]))
