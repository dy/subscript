/**
 * Loops: while, for, for-of, break, continue, return
 *
 * AST:
 *   while (c) a              → ['while', c, a]
 *   for (i;c;s) a            → ['for', i, c, s, a]
 *   for (x of arr) a         → ['for-of', 'x', arr, a]
 *   for (const x of arr) a   → ['for-of', 'x', arr, a, 'const']
 *   break/continue           → ['break'] / ['continue']
 *   return x                 → ['return', x?]
 */
import * as P from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_STATEMENT, OPAREN, CPAREN, CBRACE, PREC_SEQ, PREC_TOKEN, SEMI } from '../src/const.js'
import { parseBody, loop, BREAK, CONTINUE, Return_ as Return } from './block.js'
export { BREAK, CONTINUE } from './block.js'

const { token, expr, skip, space, err, next, parse } = P
const OF = 111 // 'o'

// while (cond) body
token('while', PREC_STATEMENT + 1, a => {
  if (a) return
  space() === OPAREN || err('Expected (')
  skip()
  return ['while', expr(0, CPAREN), parseBody()]
})

operator('while', (cond, body) => {
  cond = compile(cond); body = compile(body)
  return ctx => {
    let r, res
    while (cond(ctx)) {
      r = loop(body, ctx)
      if (r.brk) break
      if (r.cnt) continue
      if (r.ret) return r.val
      res = r.val
    }
    return res
  }
})

// for (init; cond; step) body
// for (x of iterable) body
// for (let/const x of iterable) body
// Note: init supports both expressions AND let/const declarations
token('for', PREC_STATEMENT + 1, a => {
  if (a) return
  space() === OPAREN || err('Expected (')
  skip()

  let init, name, decl = null
  const cc = space()

  // Check for let/const
  if (cc === 108 && P.cur.substr(P.idx, 3) === 'let' && !parse.id(P.cur.charCodeAt(P.idx + 3))) {
    skip(); skip(); skip() // skip 'let'
    decl = 'let'
    space()
    name = next(parse.id)
    if (!name) err('Expected identifier')
  } else if (cc === 99 && P.cur.substr(P.idx, 5) === 'const' && !parse.id(P.cur.charCodeAt(P.idx + 5))) {
    skip(); skip(); skip(); skip(); skip() // skip 'const'
    decl = 'const'
    space()
    name = next(parse.id)
    if (!name) err('Expected identifier')
  } else if (cc !== SEMI) {
    // Look ahead to detect for-of pattern: identifier followed by 'of'
    // Scan to find if pattern is: id 'of' OR something else
    let pos = P.idx
    while (parse.id(P.cur.charCodeAt(pos))) pos++
    // Skip whitespace
    while (P.cur.charCodeAt(pos) <= 32) pos++
    // Check if 'of' follows
    if (P.cur.charCodeAt(pos) === 111 && P.cur.charCodeAt(pos + 1) === 102 && !parse.id(P.cur.charCodeAt(pos + 2))) {
      // It's for-of, parse identifier
      name = next(parse.id)
    } else {
      // Traditional for, parse expression
      init = expr(PREC_SEQ)
      name = null
    }
  }

  // Check for 'of' keyword (for-of loop)
  if (name && space() === OF && P.cur.charCodeAt(P.idx + 1) === 102 && !parse.id(P.cur.charCodeAt(P.idx + 2))) {
    skip(); skip() // skip 'of'
    space()
    const iterable = expr(PREC_SEQ)
    space() === CPAREN || err('Expected )')
    skip()
    return decl
      ? ['for-of', name, iterable, parseBody(), decl]
      : ['for-of', name, iterable, parseBody()]
  }

  // Traditional for loop
  if (decl) {
    // let/const declaration as init
    space()
    if (P.cur.charCodeAt(P.idx) === 61 && P.cur.charCodeAt(P.idx + 1) !== 61) {
      skip()
      init = [decl, name, expr(PREC_SEQ)]
    } else {
      init = decl === 'const' ? err('Expected =') : [decl, name]
    }
  } else if (cc === SEMI) {
    init = null
  }

  space() === SEMI ? skip() : err('Expected ;')
  const cond = space() === SEMI ? null : expr(PREC_SEQ)
  space() === SEMI ? skip() : err('Expected ;')
  const step = space() === CPAREN ? null : expr(PREC_SEQ)
  space() === CPAREN ? skip() : err('Expected )')
  return ['for', init, cond, step, parseBody()]
})

operator('for', (init, cond, step, body) => {
  init = init ? compile(init) : null
  cond = cond ? compile(cond) : () => true
  step = step ? compile(step) : null
  body = compile(body)
  return ctx => {
    let r, res
    for (init?.(ctx); cond(ctx); step?.(ctx)) {
      r = loop(body, ctx)
      if (r.brk) break
      if (r.cnt) continue
      if (r.ret) return r.val
      res = r.val
    }
    return res
  }
})

// for-of loop
operator('for-of', (name, iterable, body) => {
  iterable = compile(iterable)
  body = compile(body)
  return ctx => {
    let r, res
    const prev = ctx[name] // Save previous value of loop var
    for (const val of iterable(ctx)) {
      ctx[name] = val
      r = loop(body, ctx)
      if (r.brk) break
      if (r.cnt) continue
      if (r.ret) return r.val
      res = r.val
    }
    ctx[name] = prev // Restore (or leave as last value? JS semantics vary)
    return res
  }
})

// break / continue / return
// Use PREC_STATEMENT + 1 so they can be parsed at PREC_STATEMENT level
// (needed for parseBody which uses expr(PREC_STATEMENT) to stop at ;)
token('break', PREC_STATEMENT + 1, a => a ? null : ['break'])
operator('break', () => () => { throw BREAK })

token('continue', PREC_STATEMENT + 1, a => a ? null : ['continue'])
operator('continue', () => () => { throw CONTINUE })

token('return', PREC_STATEMENT + 1, a => {
  if (a) return
  space()
  const c = P.cur.charCodeAt(P.idx)
  if (!c || c === CBRACE || c === SEMI) return ['return']
  return ['return', expr(PREC_STATEMENT)]
})

operator('return', val => {
  val = val !== undefined ? compile(val) : null
  return ctx => { throw new Return(val?.(ctx)) }
})
