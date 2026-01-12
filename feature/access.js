import { access, binary, group, err } from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_ACCESS, unsafe } from '../src/const.js'

// a[b]
access('[]', PREC_ACCESS)
operator('[]', (a, b) => !b ? err() : (a = compile(a), b = compile(b), ctx => { const k = b(ctx); return unsafe(k) ? undefined : a(ctx)[k] }))

// a.b
binary('.', PREC_ACCESS)
operator('.', (a, b) => (a = compile(a), b = !b[0] ? b[1] : b, unsafe(b) ? () => undefined : ctx => a(ctx)[b]))
