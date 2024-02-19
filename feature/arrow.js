import { binary, group } from "../src/parse.js"
import { compile, operator } from "../src/compile.js"
import { PREC_ASSIGN, PREC_TOKEN } from "../src/const.js"

// arrow functions (useful for array methods)
binary('=>', PREC_ASSIGN, true)
operator('=>',
  (a, b) => (
    a = a[0] === '()' ? a[1] : a,
    a = !a ? [] : // () =>
      a[0] === ',' ? (a = a.slice(1)) : // (a,c) =>
        (a = [a]), // a =>

    b = compile(b[0] === '{}' ? b[1] : b), // `=> {x}` -> `=> x`

    (ctx = null) => (
      ctx = Object.create(ctx),
      (...args) => (a.map((a, i) => ctx[a] = args[i]), b(ctx))
    )
  )
)

binary('')
