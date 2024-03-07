import { token, expr, group, binary } from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_ASSIGN, PREC_SEQ, PREC_TOKEN } from '../src/const.js'


// {a:1, b:2, c:3}
group('{}', PREC_TOKEN)
operator('{}', (a, b) => (
  // {}
  !a ? () => ({}) :
    // {a:1, b}
    a[0] === ',' ? (
      a = a.slice(1).map(p => compile(p[0] === ':' ? p : [':', p, p])), ctx => Object.fromEntries(a.map(a => a(ctx)))
    ) :
      // {a:1}, {a}
      (a = compile(a[0] === ':' ? a : [':', a, a]), ctx => Object.fromEntries([a(ctx)]))
))

binary(':', PREC_ASSIGN, true)
// "a": a, a: a
operator(':', (a, b) => (b = compile(b), Array.isArray(a) ? (a = compile(a), ctx => [a(ctx), b(ctx)]) : ctx => [a, b(ctx)]))
