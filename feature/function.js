/**
 * Function declarations and expressions
 *
 * AST:
 *   function f(a,b) { body }      → ['function', 'f', ['a','b'], body]
 *   function(a,b) { body }        → ['function', null, ['a','b'], body]
 *   function f(a, ...rest) {}     → ['function', 'f', ['a', ['...', 'rest']], body]
 *   const f = function() {}       → ['const', 'f', ['function', null, [], body]]
 */
import * as P from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_STATEMENT, PREC_TOKEN, PREC_PREFIX, OPAREN, CPAREN, OBRACE, CBRACE } from '../src/const.js'
import { Return_ as Return } from './block.js'

const { token, expr, skip, space, err, next, parse } = P
const COMMA = 44, DOT = 46

// function name?(params) { body }
token('function', PREC_TOKEN, a => {
  if (a) return // Not prefix position

  // Optional function name
  space()
  let name = null
  const cc = P.cur.charCodeAt(P.idx)
  if (cc !== OPAREN) {
    name = next(parse.id)
    space()
  }

  // (params)
  P.cur.charCodeAt(P.idx) === OPAREN || err('Expected (')
  skip()

  const params = []
  while (space() !== CPAREN) {
    // Rest param: ...args
    if (P.cur.charCodeAt(P.idx) === DOT && P.cur.charCodeAt(P.idx + 1) === DOT && P.cur.charCodeAt(P.idx + 2) === DOT) {
      const rest = expr(0) // parse '...id' with no precedence floor
      params.push(rest)
      space() !== CPAREN && err('Rest parameter must be last')
      break
    }
    const param = next(parse.id)
    if (!param) err('Expected parameter')
    params.push(param)
    if (space() === COMMA) skip()
    else if (P.cur.charCodeAt(P.idx) !== CPAREN) err('Expected , or )')
  }
  skip() // )

  // { body }
  space() === OBRACE || err('Expected {')
  skip()
  const body = expr(0, CBRACE)

  return ['function', name, params, body]
})

operator('function', (name, params, body) => {
  body = body ? compile(body) : () => undefined

  // Check for rest param (last element is ['...', id])
  let restIdx = -1, restName = null
  if (params.length && Array.isArray(params[params.length - 1]) && params[params.length - 1][0] === '...') {
    restIdx = params.length - 1
    restName = params[restIdx][1]
    params = params.slice(0, -1)
  }

  // Return a factory that creates the function in context
  return ctx => {
    const fn = (...args) => {
      // Create scope that shadows params but writes through to parent
      const locals = {}
      params.forEach((p, i) => locals[p] = args[i])
      // Rest param gets remaining args
      if (restName) locals[restName] = args.slice(restIdx)

      const fnCtx = new Proxy(locals, {
        get(l, k) { return k in l ? l[k] : ctx[k] },
        set(l, k, v) {
          // If it's a local (param or declared in fn), set locally
          if (k in l) { l[k] = v; return true }
          // Otherwise set in parent scope
          ctx[k] = v
          return true
        },
        has(l, k) { return k in l || k in ctx }
      })

      try { return body(fnCtx) }
      catch (e) {
        if (e instanceof Return) return e.value
        throw e
      }
    }
    // If named, bind to context
    if (name) ctx[name] = fn
    return fn
  }
})
