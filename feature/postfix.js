import { token, expr } from "../src/parse.js"
import { operator, compile } from "../src/compile.js"
import { PREC_POSTFIX } from "../src/const.js"

// create increment-assign pair from fn
// FIXME: make a++ -> [++, a], ++a -> [+=, a, 1]
const inc = (op, prec, fn, ev) => (
  token(op, prec, a => a ? [op === '++' ? '-' : '+', [op, a], ['', 1]] : [op, expr(prec - 1)]), // ++a → [++, a], a++ → [-,[++,a],1]
  operator(op, ev = (a, b) => (
    a[0] === '()' ? ev(a[1]) : // ++(((a)))
      a[0] === '.' ? (b = a[2], a = compile(a[1]), ctx => fn(a(ctx), b)) : // ++a.b
        a[0] === '[' ? ([, a, b] = a, a = compile(a), b = compile(b), ctx => fn(a(ctx), b(ctx))) : // ++a[b]
          (ctx => fn(ctx, a)) // ++a
  ))
)

// increments
inc('++', PREC_POSTFIX, (a, b) => ++a[b])
inc('--', PREC_POSTFIX, (a, b) => --a[b])
