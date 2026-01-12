/**
 * Switch statement
 *
 * AST:
 *   switch (val) { case x: a; break; default: b }
 *   → ['switch', val, [[x, body], ..., [null, body]]]
 *
 * Cases are arrays: [test, body]
 * Default case has test=null
 */
import * as P from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_STATEMENT, PREC_ASSIGN, OPAREN, CPAREN, OBRACE, CBRACE } from '../src/const.js'
import { BREAK } from './block.js'

const { token, expr, skip, space, err, next, parse } = P
const COLON = 58, SEMI = 59

// Check if at case/default keyword
const atCaseKeyword = () => {
  const cc = P.cur.charCodeAt(P.idx)
  if (cc === 99 && P.cur.substr(P.idx, 4) === 'case' && !parse.id(P.cur.charCodeAt(P.idx + 4))) return 'case'
  if (cc === 100 && P.cur.substr(P.idx, 7) === 'default' && !parse.id(P.cur.charCodeAt(P.idx + 7))) return 'default'
  return null
}

// Parse case body: statements until next case/default/}
function parseCaseBody() {
  const stmts = []
  while (true) {
    const cc = space()
    if (cc === CBRACE || atCaseKeyword()) break
    // Parse single statement (PREC_STATEMENT stops before ;)
    const stmt = expr(PREC_STATEMENT)
    if (stmt) stmts.push(stmt)
    // Consume optional semicolon
    if (space() === SEMI) skip()
  }
  return stmts.length === 0 ? null : stmts.length === 1 ? stmts[0] : [';', ...stmts]
}

// switch (val) { case x: ...; default: ... }
token('switch', PREC_STATEMENT + 1, a => {
  if (a) return
  space() === OPAREN || err('Expected (')
  skip()
  const val = expr(0, CPAREN)
  space() === OBRACE || err('Expected {')
  skip()

  const cases = []
  let hasDefault = false

  while (space() !== CBRACE) {
    const kw = atCaseKeyword()
    if (!kw) err('Expected case or default')

    if (kw === 'case') {
      skip(); skip(); skip(); skip() // 'case'
      space()
      // Parse test expression, stop before : (precedence PREC_ASSIGN > : precedence)
      const test = expr(PREC_ASSIGN)
      space() === COLON ? skip() : err('Expected :')
      cases.push([test, parseCaseBody()])
    } else {
      if (hasDefault) err('Duplicate default')
      hasDefault = true
      skip(); skip(); skip(); skip(); skip(); skip(); skip() // 'default'
      space() === COLON ? skip() : err('Expected :')
      cases.push([null, parseCaseBody()])
    }
  }
  skip() // }

  return ['switch', val, cases]
})

operator('switch', (val, cases) => {
  val = compile(val)
  cases = cases.map(([test, body]) => [
    test === null ? null : compile(test),
    body ? compile(body) : () => undefined
  ])

  return ctx => {
    const v = val(ctx)
    let matched = false
    let result

    for (const [test, body] of cases) {
      // Once matched, fall through until break
      if (matched || test === null || test(ctx) === v) {
        matched = true
        try {
          result = body(ctx)
        } catch (e) {
          if (e === BREAK) return result
          throw e
        }
      }
    }
    return result
  }
})
