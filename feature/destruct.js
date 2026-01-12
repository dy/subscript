/**
 * Destructuring in variable declarations
 *
 * AST:
 *   const {a, b} = x   → ['const', ['{}', 'a', 'b'], val]
 *   const [a, b] = x   → ['const', ['[]', 'a', 'b'], val]
 *   const {a: x} = y   → ['const', ['{}', [':', 'a', 'x']], val]
 *   const {a = 1} = x  → ['const', ['{}', ['=', 'a', default]], val]
 *
 * Patterns can be nested: const {a: {b}} = x
 */
import * as P from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_STATEMENT, PREC_ASSIGN, OBRACE, CBRACE, OBRACK, CBRACK } from '../src/const.js'

const { token, expr, skip, space, err, parse, next, lookup } = P
const COMMA = 44, COLON = 58, EQ = 61

// Parse destructuring pattern: identifier, {pattern}, or [pattern]
function parsePattern() {
  const cc = space()

  // Object pattern {a, b, c: d}
  if (cc === OBRACE) {
    skip()
    const props = []
    while (space() !== CBRACE) {
      const key = next(parse.id)
      if (!key) err('Expected property name')
      let binding = key
      const nc = space()
      // Rename: {a: b}
      if (nc === COLON) {
        skip()
        binding = parsePattern() // recursive for nested
      }
      // Default: {a = 1}
      let def
      if (space() === EQ) {
        skip()
        def = expr(PREC_ASSIGN)
      }
      props.push(def ? ['=', [':', key, binding], def] : [':', key, binding])
      if (space() === COMMA) skip()
    }
    skip() // }
    return ['{}', ...props]
  }

  // Array pattern [a, b, c]
  if (cc === OBRACK) {
    skip()
    const items = []
    while (space() !== CBRACK) {
      // Handle holes: [,a,,b]
      if (P.cur.charCodeAt(P.idx) === COMMA) {
        items.push(null) // hole
        skip()
        continue
      }
      let binding = parsePattern()
      // Default: [a = 1]
      if (space() === EQ) {
        skip()
        const def = expr(PREC_ASSIGN)
        binding = ['=', binding, def]
      }
      items.push(binding)
      if (space() === COMMA) skip()
    }
    skip() // ]
    return ['[]', ...items]
  }

  // Simple identifier
  const name = next(parse.id)
  if (!name) err('Expected identifier or pattern')
  return name
}

// Override let to support patterns
token('let', PREC_STATEMENT, a => {
  if (a) return
  const pattern = parsePattern()
  space()
  if (P.cur.charCodeAt(P.idx) === EQ && P.cur.charCodeAt(P.idx + 1) !== EQ) {
    skip()
    return ['let', pattern, expr(PREC_STATEMENT)]
  }
  // For simple identifiers, allow uninitialized
  if (typeof pattern === 'string') return ['let', pattern]
  err('Destructuring requires initializer')
})

// Override const to support patterns
token('const', PREC_STATEMENT, a => {
  if (a) return
  const pattern = parsePattern()
  space()
  P.cur.charCodeAt(P.idx) === EQ && P.cur.charCodeAt(P.idx + 1) !== EQ || err('Expected =')
  skip()
  return ['const', pattern, expr(PREC_STATEMENT)]
})

// Destructure value into context
function destructure(pattern, value, ctx) {
  // Simple binding
  if (typeof pattern === 'string') {
    ctx[pattern] = value
    return
  }

  const [op, ...items] = pattern

  // Object destructuring
  if (op === '{}') {
    for (const item of items) {
      // item is [':', key, binding] or ['=', [':', key, binding], default]
      let key, binding, def
      if (item[0] === '=') {
        [, [, key, binding], def] = item
      } else {
        [, key, binding] = item
      }
      let val = value[key]
      if (val === undefined && def) val = compile(def)(ctx)
      destructure(binding, val, ctx)
    }
    return
  }

  // Array destructuring
  if (op === '[]') {
    let i = 0
    for (const item of items.slice(0)) { // items after op
      if (item === null) { i++; continue } // hole
      let binding = item, def
      // Default value
      if (Array.isArray(item) && item[0] === '=') {
        [, binding, def] = item
      }
      let val = value[i++]
      if (val === undefined && def) val = compile(def)(ctx)
      destructure(binding, val, ctx)
    }
    return
  }
}

// Override let operator
operator('let', (pattern, val) => {
  if (typeof pattern === 'string') {
    // Simple binding
    val = val !== undefined ? compile(val) : null
    return ctx => { ctx[pattern] = val ? val(ctx) : undefined }
  }
  // Destructuring
  val = compile(val)
  return ctx => destructure(pattern, val(ctx), ctx)
})

// Override const operator
operator('const', (pattern, val) => {
  val = compile(val)
  if (typeof pattern === 'string') {
    return ctx => { ctx[pattern] = val(ctx) }
  }
  // Destructuring
  return ctx => destructure(pattern, val(ctx), ctx)
})
