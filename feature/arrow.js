import { binary, group } from "../src/parse.js"
import { compile, operator } from "../src/compile.js"
import { PREC_ASSIGN, PREC_TOKEN } from "../src/const.js"

// arrow functions (useful for array methods)
binary('=>', PREC_ASSIGN, true)
operator('=>',
  (a, b) => {
    // Extract params from AST
    a = a[0] === '()' ? a[1] : a
    a = !a ? [] : // () =>
      a[0] === ',' ? a.slice(1) : // (a,c) =>
        [a] // a =>

    // Check for rest param (last element is ['...', id])
    let restIdx = -1, restName = null
    if (a.length && Array.isArray(a[a.length - 1]) && a[a.length - 1][0] === '...') {
      restIdx = a.length - 1
      restName = a[restIdx][1]
      a = a.slice(0, -1)
    }

    b = compile(b[0] === '{}' ? b[1] : b) // `=> {x}` -> `=> x`

    return (ctx = null) => {
      ctx = Object.create(ctx)
      return (...args) => {
        a.forEach((p, i) => ctx[p] = args[i])
        if (restName) ctx[restName] = args.slice(restIdx)
        return b(ctx)
      }
    }
  }
)

binary('')
