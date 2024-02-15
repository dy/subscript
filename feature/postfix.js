import { token, expr } from "../src/parse.js"
import { operator, compile } from "../src/compile.js"
import { PREC_POSTFIX } from "../src/const.js"

// create increment-assign pair from fn
// FIXME: make a++ -> [++, a], ++a -> [+=, a, 1]

let inc, dec
token('++', PREC_POSTFIX, a => a ? ['-', ['++', a], ['', 1]] : ['++', expr(PREC_POSTFIX - 1)]) // ++a → [++, a], a++ → [-,[++,a],1]
operator('++', inc = (a, b) => (
  // ++(((a)))
  a[0] === '()' ? inc(a[1]) :
    // ++a.b
    a[0] === '.' ? (b = a[2], a = compile(a[1]), ctx => ++a(ctx)[b]) :
      // ++a[b]
      a[0] === '[' ? ([, a, b] = a, a = compile(a), b = compile(b), ctx => ++a(ctx)[b(ctx)]) :
        // ++a
        (ctx => ++ctx[a])
))

token('--', PREC_POSTFIX, a => a ? ['+', ['--', a], ['', 1]] : ['--', expr(PREC_POSTFIX - 1)]) // --a → [--, a], a-- → [-,[--,a],1]
operator('--', dec = (a, b) => (
  // --(((a)))
  a[0] === '()' ? dec(a[1]) :
    // --a.b
    a[0] === '.' ? (b = a[2], a = compile(a[1]), ctx => --a(ctx)[b]) :
      // --a[b]
      a[0] === '[' ? ([, a, b] = a, a = compile(a), b = compile(b), ctx => --a(ctx)[b(ctx)]) :
        // --a
        (ctx => --ctx[a])
))
