// Tests for jessie preset - safe JS subset

import test, { is, throws } from 'tst'
import { parse, compile } from '../subscript.js'

// Import jessie preset (includes all jessie features)
import '../jessie.js'

const run = (code, ctx = {}) => compile(parse(code))(ctx)

test('jessie: exports', async () => {
  const mod = await import('../jessie.js')
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

test('jessie: JSON roundtrip - variables', () => {
  // let x
  let ast = parse('let x')
  let restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['let', 'x'])

  // let x = 1
  ast = parse('let x = 1')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['let', ['=', 'x', [null, 1]]])
  run('let x = 5', {})  // should not throw

  // const y = 2
  ast = parse('const y = 2')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['const', ['=', 'y', [null, 2]]])
})

test('jessie: JSON roundtrip - for loops', () => {
  // for (x of arr)
  let ast = parse('for (x of arr) x')
  let restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['for', ['of', 'x', 'arr'], 'x'])
  let result = []
  run('for (x of arr) result.push(x)', { arr: [1, 2, 3], result })
  is(result, [1, 2, 3])

  // for (const x of arr)
  ast = parse('for (const x of arr) x')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['for', ['of', ['const', 'x'], 'arr'], 'x'])

  // for (let x of arr)
  ast = parse('for (let x of arr) x')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['for', ['of', ['let', 'x'], 'arr'], 'x'])

  // for (x in obj)
  ast = parse('for (x in obj) x')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['for', ['in', 'x', 'obj'], 'x'])

  // for (;;)
  ast = parse('for (;;) break')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['for', [';', null, null, null], ['break']])
})

test('jessie: JSON roundtrip - try/catch', () => {
  // try { a } catch (e) { b } — uses 'catch' operator wrapping try
  let ast = parse('try { a } catch (e) { b }')
  let restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['catch', ['try', 'a'], 'e', 'b'])

  // try { a } finally { c } — uses 'finally' operator wrapping try
  ast = parse('try { a } finally { c }')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['finally', ['try', 'a'], 'c'])

  // try { a } catch (e) { b } finally { c } — finally wraps catch wraps try
  ast = parse('try { a } catch (e) { b } finally { c }')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['finally', ['catch', ['try', 'a'], 'e', 'b'], 'c'])
})

test('jessie: JSON roundtrip - functions', () => {
  // function f(a, b) { c }
  let ast = parse('function f(a, b) { c }')
  let restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['function', 'f', [',', 'a', 'b'], 'c'])

  // function(x) { y } — empty string for anonymous
  ast = parse('function(x) { y }')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['function', '', 'x', 'y'])

  // x => x (no parens)
  ast = parse('x => x')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['=>', 'x', 'x'])

  // (a, b) => a + b — parens preserved in AST
  ast = parse('(a, b) => a + b')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['=>', ['()', [',', 'a', 'b']], ['+', 'a', 'b']])
})

test('jessie: JSON roundtrip - property access', () => {
  // a.b - name is token
  let ast = parse('a.b')
  let restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['.', 'a', 'b'])

  // a?.b - name is token
  ast = parse('a?.b')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['?.', 'a', 'b'])
})

test('jessie: compile from JSON-restored AST', () => {
  // Full roundtrip: parse → JSON → restore → compile → run
  const cases = [
    ['let x = 5; x * 2', {}, 10],
    ['x => x * 2', {}, fn => fn(5) === 10],
    ['a.b', { a: { b: 42 } }, 42],
    ['a?.b', { a: { b: 42 } }, 42],
    ['a?.b', { a: null }, undefined],
  ]

  for (const [code, ctx, expected] of cases) {
    const ast = parse(code)
    const restored = JSON.parse(JSON.stringify(ast))
    const result = compile(restored)(ctx)
    if (typeof expected === 'function') {
      is(expected(result), true, code)
    } else {
      is(result, expected, code)
    }
  }
})
