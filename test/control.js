import test, { is, throws } from 'tst'
import { parse, compile } from '../subscript.js'
import '../feature/if.js'
import '../feature/loop.js'
import '../feature/var.js'

const run = (code, ctx = {}) => compile(parse(code))(ctx)

test('control: if', t => {
  is(parse('if (a) b'), ['if', 'a', 'b'])
  is(parse('if (a) b else c'), ['if', 'a', 'b', 'c'])
  is(run('if (x) 1', { x: true }), 1)
  is(run('if (x) 1', { x: false }), undefined)
  is(run('if (x) 1 else 2', { x: true }), 1)
  is(run('if (x) 1 else 2', { x: false }), 2)
  // nested else if
  is(run('if (a) 1 else if (b) 2 else 3', { a: false, b: true }), 2)
})

test('control: while', t => {
  is(parse('while (a) b'), ['while', 'a', 'b'])
  let ctx = { i: 0, sum: 0 }
  run('while (i < 3) (sum += i, i += 1)', ctx)
  is(ctx.sum, 3)
  is(ctx.i, 3)
})

test('control: for', t => {
  is(parse('for (i = 0; i < 3; i += 1) x'), ['for', ['=', 'i', [, 0]], ['<', 'i', [, 3]], ['+=', 'i', [, 1]], 'x'])
  is(parse('for (;;) x'), ['for', null, null, null, 'x'])
  let ctx = { sum: 0 }
  run('for (i = 0; i < 5; i += 1) sum += i', ctx)
  is(ctx.sum, 10)
})

test('control: break', t => {
  is(parse('break'), ['break'])
  let ctx = { i: 0 }
  run('while (i < 10) ((if (i == 3) break), i += 1)', ctx)
  is(ctx.i, 3)
  ctx = { last: 0 }
  run('for (i = 0; i < 10; i += 1) (if (i == 5) break else (last = i))', ctx)
  is(ctx.last, 4)
})

test('control: continue', t => {
  is(parse('continue'), ['continue'])
  let ctx = { i: 0, sum: 0 }
  run('while (i < 5) (i += 1, (if (i == 3) continue), sum += i)', ctx)
  is(ctx.sum, 12) // 1+2+4+5
})

test('control: return', t => {
  is(parse('return 42'), ['return', [, 42]])
  is(parse('return'), ['return'])
})

test('control: block', t => {
  // blocks only work inside control structures, not standalone (to avoid conflict with object literal)
  is(parse('if (1) { a }'), ['if', [, 1], ['block', 'a']])
  is(parse('if (1) { a; b }'), ['if', [, 1], ['block', [';', 'a', 'b']]])
  is(parse('while (x) { y }'), ['while', 'x', ['block', 'y']])
  // block creates new scope
  let ctx = { x: 1 }
  run('if (1) { x = 2 }', ctx)
  is(ctx.x, 1) // outer unchanged due to Object.create scope
})

test('control: let', t => {
  is(parse('let x'), ['let', 'x'])
  is(parse('let x = 1'), ['let', 'x', [, 1]])
  let ctx = {}
  run('let x = 5', ctx)
  is(ctx.x, 5)
})

test('control: const', t => {
  is(parse('const x = 1'), ['const', 'x', [, 1]])
  let ctx = {}
  run('const x = 42', ctx)
  is(ctx.x, 42)
  throws(() => parse('const x')) // requires initializer
})
