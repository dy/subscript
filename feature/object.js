import { token, expr, group, binary } from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_ASSIGN, PREC_SEQ, PREC_TOKEN } from '../src/const.js'


// {a:1, b:2, c:3}
group('{}', PREC_TOKEN)
operator('{}', (a, b) => b === undefined && (
  // {}, {a:b}, {a}, {a, b}
  a = (!a ? [] : a[0] !== ',' ? [a] : a.slice(1)),
  a = a.map(p => compile(typeof p === 'string' ? [':', p, p] : p)),
  ctx => Object.fromEntries(a.flatMap(frag => frag(ctx)))
))

binary(':', PREC_ASSIGN - 1, true)
// "a": a, a: a
operator(':', (a, b) => (b = compile(b), Array.isArray(a) ? (a = compile(a), ctx => [[a(ctx), b(ctx)]]) : ctx => [[a, b(ctx)]]))
