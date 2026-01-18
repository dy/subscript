import test, { is, throws } from 'tst'
import { parse, compile } from '../../subscript.js'
// Control flow features (if, loop, var) already included via jessie preset

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
  is(parse('for (i = 0; i < 3; i += 1) x'), ['for', [';', ['=', 'i', [, 0]], ['<', 'i', [, 3]], ['+=', 'i', [, 1]]], 'x'])
  is(parse('for (;;) x'), ['for', [';', null, null, null], 'x'])
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

test('control: break/continue in sequence preserves prior value', t => {
  // break in middle of sequence - value before break should be returned from loop
  let ctx = { i: 0, values: [] }
  run('while (i < 5) (values.push(i), i += 1, (if (i == 3) break))', ctx)
  is(ctx.values.join(','), '0,1,2')
  is(ctx.i, 3)

  // continue in sequence - loop should skip remainder but continue iteration
  ctx = { i: 0, values: [] }
  run('while (i < 5) (i += 1, (if (i == 3) continue), values.push(i))', ctx)
  is(ctx.values.join(','), '1,2,4,5') // 3 is skipped
})

test('control: return', t => {
  is(parse('return 42'), ['return', [, 42]])
  is(parse('return'), ['return'])
})

test('control: block', t => {
  // blocks are just sequences, no wrapper node
  is(parse('if (1) { a }'), ['if', [, 1], 'a'])
  is(parse('if (1) { a; b }'), ['if', [, 1], [';', 'a', 'b']])
  is(parse('while (x) { y }'), ['while', 'x', 'y'])
  // blocks allow access to outer scope (like JS)
  let ctx = { x: 1 }
  run('if (1) { x = 2 }', ctx)
  is(ctx.x, 2) // outer modified (correct JS behavior)
})

test('control: let', t => {
  is(parse('let x'), ['let', 'x'])
  is(parse('let x = 1'), ['let', ['=', 'x', [, 1]]])
  let ctx = {}
  run('let x = 5', ctx)
  is(ctx.x, 5)
})

test('control: const', t => {
  is(parse('const x = 1'), ['const', ['=', 'x', [, 1]]])
  is(parse('const x'), ['const', 'x']) // no init - validation deferred to compile
  let ctx = {}
  run('const x = 42', ctx)
  is(ctx.x, 42)
})

test('control: var', t => {
  is(parse('var x')[0], 'var')
  // var x = 5 becomes assignment to var declaration (different from let/const)
  is(parse('var x = 5')[0], '=')
  is(parse('var x = 5')[1][0], 'var')
})

test('control: do-while', t => {
  const ast = parse('do { x } while (c)')
  is(ast[0], 'do')
  is(ast[2], 'c', 'condition')
  let ctx = { i: 0 }
  run('do { i += 1 } while (i < 3)', ctx)
  is(ctx.i, 3)
  // do-while runs at least once
  ctx = { i: 10 }
  run('do { i += 1 } while (i < 3)', ctx)
  is(ctx.i, 11)
})

test('control: for-in', t => {
  const ast = parse('for (let x in obj) y')
  is(ast[0], 'for')
  is(ast[1][0], 'in')
  is(ast[1][1][0], 'let')
  is(ast[1][1][1], 'x')
  is(ast[1][2], 'obj')
  is(ast[2], 'y')
  let ctx = { keys: [], obj: { a: 1, b: 2 } }
  run('for (let k in obj) keys.push(k)', ctx)
  is(ctx.keys.sort().join(','), 'a,b')
})

test('control: for with var multi-decl', t => {
  const ast = parse('for (var i = 0, j = 1; i < 3; i++) {}')
  is(ast[0], 'for')
  is(ast[1][0], ';')
  is(ast[1][1][0], ',', 'multi-var uses comma operator')
})
