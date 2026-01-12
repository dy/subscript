/**
 * Block scope and control flow infrastructure
 *
 * AST:
 *   { a; b }  → ['block', [';', a, b]]
 *
 * Shared by: if.js, loop.js, control.js
 */
import * as P from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { OBRACE, CBRACE } from '../src/const.js'

const { expr, skip, space } = P

// Control signals for break/continue/return
class Break {}
class Continue {}
class Return { constructor(v) { this.value = v } }
export const BREAK = new Break(), CONTINUE = new Continue(), Return_ = Return

// Shared loop body executor - handles control flow signals
export const loop = (body, ctx) => {
  try { return { val: body(ctx) } }
  catch (e) {
    if (e === BREAK) return { brk: 1 }
    if (e === CONTINUE) return { cnt: 1 }
    if (e instanceof Return) return { ret: 1, val: e.value }
    throw e
  }
}

// Block parsing helper - parses { body } or single expression
export const parseBody = () => {
  if (space() === OBRACE) {
    skip()
    return ['block', expr(0, CBRACE)]
  }
  return expr(0)
}

// Block operator - creates new scope
operator('block', body => {
  if (body === undefined) return () => {}
  body = compile(body)
  return ctx => body(Object.create(ctx))
})
