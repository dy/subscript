/**
 * Object accessor properties (getters/setters)
 *
 * AST:
 *   { get x() { body } }         → ['{}', ['get', 'x', body]]
 *   { set x(v) { body } }        → ['{}', ['set', 'x', 'v', body]]
 *
 * Compiles to descriptor-returning functions that {} operator applies via Object.defineProperty
 */
import * as P from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_ASSIGN, OPAREN, CPAREN, OBRACE, CBRACE } from '../src/const.js'

const { token, expr, skip, space, err, next, parse } = P

// Shared parser for get/set — only difference is param count
const accessor = (kind, hasParam) => (a => {
  if (a) return // not prefix
  space()
  const name = next(parse.id)
  if (!name) return

  space()
  if (P.cur.charCodeAt(P.idx) !== OPAREN) return
  skip()

  const param = hasParam && (space(), next(parse.id))
  hasParam && !param && err('Expected parameter')

  space()
  P.cur.charCodeAt(P.idx) === CPAREN || err('Expected )')
  skip()

  space()
  P.cur.charCodeAt(P.idx) === OBRACE || err('Expected {')
  skip()

  return [kind, name, ...(hasParam ? [param] : []), expr(0, CBRACE)]
})

token('get', PREC_ASSIGN - 1, accessor('get', false))
token('set', PREC_ASSIGN - 1, accessor('set', true))

// Symbol marks accessor entries (avoids string collision)
const ACC = Symbol('accessor')

// get x() { body } → returns [ACC, name, {get}]
operator('get', (name, body) => {
  body = body ? compile(body) : () => {}
  return ctx => [[ACC, name, {
    get() { const s = Object.create(ctx || {}); s.this = this; return body(s) }
  }]]
})

// set x(v) { body } → returns [ACC, name, {set}]
operator('set', (name, param, body) => {
  body = body ? compile(body) : () => {}
  return ctx => [[ACC, name, {
    set(v) { const s = Object.create(ctx || {}); s.this = this; s[param] = v; body(s) }
  }]]
})

// Extend {} to handle accessors
const origObj = operator('{}')
operator('{}', (a, b) => {
  if (b !== undefined) return origObj?.(a, b)

  a = !a ? [] : a[0] !== ',' ? [a] : a.slice(1)
  const props = a.map(p => compile(typeof p === 'string' ? [':', p, p] : p))

  return ctx => {
    const obj = {}, acc = {}
    for (const e of props.flatMap(f => f(ctx))) {
      if (e[0] === ACC) {
        const [, n, desc] = e
        acc[n] = { ...acc[n], ...desc, configurable: true, enumerable: true }
      } else {
        obj[e[0]] = e[1]
      }
    }
    for (const n in acc) Object.defineProperty(obj, n, acc[n])
    return obj
  }
})
