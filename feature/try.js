/**
 * try/catch/finally statements
 *
 * AST:
 *   try { a } catch (e) { b }             → ['try', a, 'e', b]
 *   try { a } finally { c }               → ['try', a, null, null, c]
 *   try { a } catch (e) { b } finally { c } → ['try', a, 'e', b, c]
 */
import * as P from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_STATEMENT, OBRACE, CBRACE, OPAREN, CPAREN } from '../src/const.js'
import { BREAK, CONTINUE, Return_ as Return } from './block.js'

const { token, expr, skip, space, err, next, parse } = P

token('try', PREC_STATEMENT + 1, a => {
  if (a) return
  // try { body }
  space() === OBRACE || err('Expected {')
  skip()
  const tryBody = space() === CBRACE ? (skip(), null) : expr(0, CBRACE)

  let catchName = null, catchBody = null, finallyBody = null

  // catch (e) { body }?
  if (space() === 99 && P.cur.substr(P.idx, 5) === 'catch') {
    skip(); skip(); skip(); skip(); skip()
    space() === OPAREN || err('Expected (')
    skip()
    catchName = next(parse.id)
    if (!catchName) err('Expected identifier')
    space() === CPAREN || err('Expected )')
    skip()
    space() === OBRACE || err('Expected {')
    skip()
    catchBody = space() === CBRACE ? (skip(), null) : expr(0, CBRACE)
  }

  // finally { body }?
  if (space() === 102 && P.cur.substr(P.idx, 7) === 'finally') {
    skip(); skip(); skip(); skip(); skip(); skip(); skip()
    space() === OBRACE || err('Expected {')
    skip()
    finallyBody = space() === CBRACE ? (skip(), null) : expr(0, CBRACE)
  }

  if (!catchName && !finallyBody) err('Expected catch or finally')

  return finallyBody
    ? ['try', tryBody, catchName, catchBody, finallyBody]
    : ['try', tryBody, catchName, catchBody]
})

operator('try', (tryBody, catchName, catchBody, finallyBody) => {
  tryBody = tryBody ? compile(tryBody) : null
  catchBody = catchBody ? compile(catchBody) : null
  finallyBody = finallyBody ? compile(finallyBody) : null

  return ctx => {
    let result
    try {
      result = tryBody?.(ctx)
    } catch (e) {
      // Let control flow signals through - don't catch break/continue/return
      if (e === BREAK || e === CONTINUE || e instanceof Return) throw e

      if (catchName !== null) {
        // Have a catch clause (even if empty body)
        if (catchBody) {
          // Add error to current scope (don't create child scope)
          // Save original value to restore after catch
          const hadName = catchName in ctx
          const origVal = ctx[catchName]
          ctx[catchName] = e
          try {
            result = catchBody(ctx)
          } finally {
            // Restore original binding
            if (hadName) ctx[catchName] = origVal
            else delete ctx[catchName]
          }
        }
        // else: empty catch block, just swallow exception
      } else throw e
    } finally {
      if (finallyBody) finallyBody(ctx)
    }
    return result
  }
})
