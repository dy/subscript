// Tests for jessie preset - safe JS subset

import test, { is, throws } from 'tst'
import { parse, compile } from '../../subscript.js'

// Import jessie preset (includes all jessie features)
import '../../parse/jessie.js'

const run = (code, ctx = {}) => compile(parse(code))(ctx)

test('jessie: exports', async () => {
  const mod = await import('../../parse/jessie.js')
  is(typeof mod.parse, 'function')
})

test('jessie: inherits justin', () => {
  // Everything from justin works
  is(parse('a && b'), ['&&', 'a', 'b'])
  is(parse('true'), [, true])
  is(parse('a?.b'), ['?.', 'a', 'b'])
  is(parse('a ?? b'), ['??', 'a', 'b'])
  is(parse('x => x'), ['=>', 'x', 'x'])
  is(parse('[1, 2]'), ['[]', [',', [, 1], [, 2]]])
  is(parse('{a: 1}'), ['{}', [':', 'a', [, 1]]])
})

test('jessie: variables', () => {
  is(parse('let x = 1'), ['let', ['=', 'x', [, 1]]])
  is(parse('const y = 2'), ['const', ['=', 'y', [, 2]]])
  is(run('let x = 5; x * 2', {}), 10)
})

test('jessie: control flow', () => {
  is(parse('if (x) y'), ['if', 'x', 'y'])
  is(parse('while (x) y'), ['while', 'x', 'y'])
  is(parse('for (;;) x'), ['for', [';', null, null, null], 'x'])
})

test('jessie: blocks', () => {
  is(parse('{ x; y }'), ['{}', [';', 'x', 'y']])
})

test('jessie: return/break/continue', () => {
  is(parse('return x'), ['return', 'x'])
  is(parse('break'), ['break'])
  is(parse('continue'), ['continue'])
})

test('jessie: typeof', () => {
  is(parse('typeof x'), ['typeof', 'x'])
  is(run('typeof x', { x: 42 }), 'number')
})

test('jessie: new', () => {
  is(parse('new X()')[0], 'new')
  is(parse('new X(a, b)')[1][0], '()')  // ['new', ['()', 'X', ...]]
  is(parse('new a.b.C()')[0], 'new')
})

test('jessie: compile integration', () => {
  is(run('1 + 2', {}), 3)
  is(run('let x = 5; x * 2', {}), 10)
  is(run('((x) => x * 2)(5)', {}), 10)

  // Control flow
  let ctx = { result: 0 }
  run('if (1) result = 42', ctx)
  is(ctx.result, 42)

  // Loops
  ctx = { sum: 0 }
  run('for (let i = 0; i < 5; i++) sum = sum + i', ctx)
  is(ctx.sum, 10)
})
