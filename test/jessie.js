// Comprehensive jessie feature tests
import test, { is, throws } from 'tst'
import { parse, compile } from '../subscript.js'
import '../jessie.js'

const run = (code, ctx = {}) => compile(parse(code))(ctx)

// === exports ===

test('jessie: exports', async () => {
  const mod = await import('../jessie.js')
  is(typeof mod.parse, 'function')
})

// === inherits justin ===

test('jessie: inherits justin', () => {
  is(parse('a && b'), ['&&', 'a', 'b'])
  is(parse('true'), [, true])
  is(parse('a?.b'), ['?.', 'a', 'b'])
  is(parse('a ?? b'), ['??', 'a', 'b'])
  is(parse('x => x'), ['=>', 'x', 'x'])
  is(parse('[1, 2]'), ['[]', [',', [, 1], [, 2]]])
  is(parse('{a: 1}'), ['{}', [':', 'a', [, 1]]])
})

// === variables ===

test('jessie: variables', () => {
  is(parse('let x = 1'), ['let', ['=', 'x', [, 1]]])
  is(parse('const y = 2'), ['const', ['=', 'y', [, 2]]])
  is(run('let x = 5; x * 2', {}), 10)
})

// === control flow ===

test('jessie: control flow', () => {
  is(parse('if (x) y'), ['if', 'x', 'y'])
  is(parse('while (x) y'), ['while', 'x', 'y'])
  is(parse('for (;;) x'), ['for', [';', null, null, null], 'x'])
})

test('jessie: standalone if statement', () => {
  is(parse('if (x) y')[0], 'if')
  is(parse('if (x) y').length, 3, 'no else branch')

  const ast = parse('if (x < 0) return -1')
  is(ast[0], 'if')
  is(ast[2][0], 'return')

  let ctx = { x: true, y: 0 }
  run('if (x) y = 1', ctx)
  is(ctx.y, 1)

  ctx = { x: false, y: 0 }
  run('if (x) y = 1', ctx)
  is(ctx.y, 0, 'false condition skips body')
})

// === blocks ===

test('jessie: blocks', () => {
  is(parse('{ x; y }'), ['{}', [';', 'x', 'y']])
})

test('jessie: block vs object detection', () => {
  // Blocks - detected by statement keywords
  is(parse('{a;b}'), ['{}', [';', 'a', 'b']])
  is(parse('{let x=1}'), ['{}', ['let', ['=', 'x', [, 1]]]])
  is(parse('{return x}'), ['{}', ['return', 'x']])
  is(parse('{if(1)2}'), ['{}', ['if', [, 1], [, 2]]])

  // Objects - no statement keywords
  is(parse('{}'), ['{}', null])
  is(parse('{a}'), ['{}', 'a'])
  is(parse('{a:1}'), ['{}', [':', 'a', [, 1]]])
  is(parse('{a,b}'), ['{}', [',', 'a', 'b']])

  // Block evaluation - creates scope, returns last value
  is(run('{let x=1; x+1}'), 2)
  is(run('{let x=1}; x', {x: 5}), 5)  // block scope doesn't leak

  // Object evaluation
  is(run('{}'), {})
  is(run('{a}', {a: 5}), {a: 5})
  is(run('{a:1}'), {a: 1})
})

test('jessie: arrow block vs object', () => {
  // Arrow with block body - returns undefined unless explicit return
  is(run('(()=>{1})()'), undefined)
  is(run('(()=>{a})()'), undefined)
  is(run('(()=>{return 1})()'), 1)
  is(run('(()=>{let x=1; return x})()'), 1)

  // Arrow with expression body - returns value
  is(run('(()=>1)()'), 1)
  is(run('(()=>a)()', {a: 5}), 5)

  // Arrow returning object - needs parens
  is(run('(()=>({a}))()', {a: 5}), {a: 5})
  is(run('(()=>({a:1}))()'), {a: 1})
})

// === return/break/continue ===

test('jessie: return/break/continue', () => {
  is(parse('return x'), ['return', 'x'])
  is(parse('break'), ['break'])
  is(parse('continue'), ['continue'])
})

// === typeof/new ===

test('jessie: typeof', () => {
  is(parse('typeof x'), ['typeof', 'x'])
  is(run('typeof x', { x: 42 }), 'number')
})

test('jessie: new', () => {
  is(parse('new X()')[0], 'new')
  is(parse('new X(a, b)')[1][0], '()')
  is(parse('new a.b.C()')[0], 'new')
})

// === try/catch/finally/throw ===

test('jessie: try basic', () => {
  is(parse('try { x }')[0], 'try')
  is(parse('try { x }')[1], 'x')
})

test('jessie: try-catch', () => {
  const ast = parse('try { x } catch (e) { y }')
  is(ast[0], 'catch')
  is(ast[1][0], 'try')
  is(ast[2], 'e')
  is(ast[3], 'y')
})

test('jessie: try-finally', () => {
  const ast = parse('try { x } finally { y }')
  is(ast[0], 'finally')
  is(ast[1][0], 'try')
  is(ast[2], 'y')
})

test('jessie: try-catch-finally', () => {
  const ast = parse('try { a } catch (e) { b } finally { c }')
  is(ast[0], 'finally')
  is(ast[1][0], 'catch')
  is(ast[2], 'c')
})

test('jessie: throw', () => {
  is(parse('throw x')[0], 'throw')
  is(parse('throw x')[1], 'x')
  is(parse('throw new Error()')[0], 'throw')
})

test('jessie: try-catch compile', () => {
  let ctx = { r: 0 }
  run('try { r = 1 } catch (e) { r = 2 }', ctx)
  is(ctx.r, 1)

  ctx = { r: 0, err: null }
  run('try { throw "oops" } catch (e) { err = e; r = 2 }', ctx)
  is(ctx.r, 2)
  is(ctx.err, 'oops')
})

test('jessie: finally always runs', () => {
  let ctx = { r: 0, f: 0 }
  run('try { r = 1 } finally { f = 1 }', ctx)
  is(ctx.r, 1)
  is(ctx.f, 1)

  ctx = { r: 0, f: 0 }
  run('try { throw 1 } catch (e) { r = e } finally { f = 1 }', ctx)
  is(ctx.r, 1)
  is(ctx.f, 1)
})

// === function declaration ===

test('jessie: function declaration', () => {
  const ast = parse('function f(a) { return a }')
  is(ast[0], 'function')
  is(ast[1], 'f')
  is(ast[2], 'a')
  is(ast[3][0], 'return')
})

test('jessie: function anonymous', () => {
  const ast = parse('function () { x }')
  is(ast[0], 'function')
  is(ast[1], '')
  is(ast[2], null)
  is(ast[3], 'x')
})

test('jessie: function multiple params', () => {
  const ast = parse('function add(a, b) { return a + b }')
  is(ast[0], 'function')
  is(ast[2][0], ',')
  is(ast[2][1], 'a')
  is(ast[2][2], 'b')
})

test('jessie: function compile', () => {
  let ctx = {}
  run('function double(x) { return x * 2 }', ctx)
  is(typeof ctx.double, 'function')
  is(ctx.double(5), 10)

  ctx = { factor: 3 }
  run('function mult(x) { return x * factor }', ctx)
  is(ctx.mult(4), 12)
})

test('jessie: early return', () => {
  let ctx = {}
  run('function guard(x) { if (x < 0) return -1; return x * 2 }', ctx)
  is(ctx.guard(-5), -1, 'early return on negative')
  is(ctx.guard(5), 10, 'normal path')

  ctx = {}
  run('function grade(s) { if (s >= 90) return "A"; if (s >= 80) return "B"; return "C" }', ctx)
  is(ctx.grade(95), 'A')
  is(ctx.grade(85), 'B')
  is(ctx.grade(70), 'C')

  ctx = { called: false }
  run('function maybe(x) { if (!x) return; called = true }', ctx)
  ctx.maybe(false)
  is(ctx.called, false, 'early return prevented side effect')
  ctx.maybe(true)
  is(ctx.called, true, 'no early return, side effect happened')
})

test('jessie: function rest param', () => {
  const ast = parse('function f(a, ...rest) { return rest }')
  is(ast[2][0], ',')
  is(ast[2][2][0], '...')

  let ctx = {}
  run('function sum(first, ...nums) { let t = first; for (let n of nums) t = t + n; return t }', ctx)
  is(ctx.sum(1, 2, 3, 4), 10)
})

// === destructuring ===

test('jessie: array destructure', () => {
  let ctx = {}
  run('let [a, b] = [1, 2]', ctx)
  is(ctx.a, 1)
  is(ctx.b, 2)
})

test('jessie: array destructure skip', () => {
  let ctx = {}
  run('let [a, , c] = [1, 2, 3]', ctx)
  is(ctx.a, 1)
  is(ctx.c, 3)
})

test('jessie: array destructure rest', () => {
  let ctx = {}
  run('let [first, ...rest] = [1, 2, 3, 4]', ctx)
  is(ctx.first, 1)
  is(ctx.rest.join(','), '2,3,4')
})

test('jessie: object destructure', () => {
  let ctx = { obj: { x: 10, y: 20 } }
  run('let {x, y} = obj', ctx)
  is(ctx.x, 10)
  is(ctx.y, 20)
})

test('jessie: object destructure rename', () => {
  let ctx = { obj: { x: 10 } }
  run('let {x: renamed} = obj', ctx)
  is(ctx.renamed, 10)
})

test('jessie: destructure default value', () => {
  let ctx = {}
  run('let [a, b = 99] = [1]', ctx)
  is(ctx.a, 1)
  is(ctx.b, 99)

  ctx = { obj: { x: 10 } }
  run('let {x, y = 42} = obj', ctx)
  is(ctx.x, 10)
  is(ctx.y, 42)
})

test('jessie: nested array destructure', () => {
  let ctx = {}
  run('let [a, [b, c]] = [1, [2, 3]]', ctx)
  is(ctx.a, 1)
  is(ctx.b, 2)
  is(ctx.c, 3)
})

test('jessie: object rest destructure', () => {
  let ctx = {}
  run('let {a, ...rest} = {a: 1, b: 2, c: 3}', ctx)
  is(ctx.a, 1)
  is(ctx.rest.b, 2)
  is(ctx.rest.c, 3)
})

// === module syntax (parse only) ===

test('jessie: import path', () => {
  const ast = parse("import './module.js'")
  is(ast[0], 'import')
  is(ast[1][1], './module.js')
})

test('jessie: import default', () => {
  const ast = parse("import X from './x.js'")
  is(ast[0], 'import')
  is(ast[1][0], 'from')
  is(ast[1][1], 'X')
})

test('jessie: import named', () => {
  const ast = parse("import { a, b } from './x.js'")
  is(ast[0], 'import')
  is(ast[1][0], 'from')
  is(ast[1][1][0], '{}')
})

test('jessie: import star', () => {
  const ast = parse("import * as M from './x.js'")
  is(ast[0], 'import')
  is(ast[1][1][0], 'as')
  is(ast[1][1][1], '*')
  is(ast[1][1][2], 'M')
})

test('jessie: export const', () => {
  const ast = parse('export const x = 1')
  is(ast[0], 'export')
  is(ast[1][0], 'const')
})

test('jessie: export default', () => {
  const ast = parse('export default x')
  is(ast[0], 'export')
  is(ast[1][0], 'default')
})

test('jessie: export from', () => {
  const ast = parse("export { a } from './x.js'")
  is(ast[0], 'export')
  is(ast[1][0], 'from')
})

// === for-of/for-in ===

test('jessie: for-of', () => {
  const ast = parse('for (let x of arr) y')
  is(ast[0], 'for')
  is(ast[1][0], 'of')
  is(ast[1][1][0], 'let')

  let ctx = { arr: [1, 2, 3], sum: 0 }
  run('for (let x of arr) sum = sum + x', ctx)
  is(ctx.sum, 6)
})

// === accessor get/set ===

test('jessie: get accessor', () => {
  const ast = parse('get x() { return 1 }')
  is(ast[0], 'get')
  is(ast[1], 'x')
})

test('jessie: set accessor', () => {
  const ast = parse('set x(v) { y = v }')
  is(ast[0], 'set')
  is(ast[1], 'x')
  is(ast[2], 'v')
})

// === ASI (automatic semicolon insertion) ===

test('jessie: ASI basic', () => {
  const ast = parse('a\nb')
  is(ast[0], ';')
  is(ast[1], 'a')
  is(ast[2], 'b')
})

test('jessie: ASI return', () => {
  const ast = parse('return\nx')
  is(ast[0], ';')
  is(ast[1][0], 'return')
  is(ast[2], 'x')
})

// === compile integration ===

test('jessie: compile integration', () => {
  is(run('1 + 2', {}), 3)
  is(run('let x = 5; x * 2', {}), 10)
  is(run('((x) => x * 2)(5)', {}), 10)

  let ctx = { result: 0 }
  run('if (1) result = 42', ctx)
  is(ctx.result, 42)

  ctx = { sum: 0 }
  run('for (let i = 0; i < 5; i++) sum = sum + i', ctx)
  is(ctx.sum, 10)
})

// === JSON roundtrip ===

test('jessie: JSON roundtrip - variables', () => {
  let ast = parse('let x')
  let restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['let', 'x'])

  ast = parse('let x = 1')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['let', ['=', 'x', [null, 1]]])

  ast = parse('const y = 2')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['const', ['=', 'y', [null, 2]]])
})

test('jessie: JSON roundtrip - for loops', () => {
  let ast = parse('for (x of arr) x')
  let restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['for', ['of', 'x', 'arr'], 'x'])
  let result = []
  run('for (x of arr) result.push(x)', { arr: [1, 2, 3], result })
  is(result, [1, 2, 3])

  ast = parse('for (const x of arr) x')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['for', ['of', ['const', 'x'], 'arr'], 'x'])

  ast = parse('for (let x of arr) x')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['for', ['of', ['let', 'x'], 'arr'], 'x'])

  ast = parse('for (x in obj) x')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['for', ['in', 'x', 'obj'], 'x'])

  ast = parse('for (;;) break')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['for', [';', null, null, null], ['break']])
})

test('jessie: JSON roundtrip - try/catch', () => {
  let ast = parse('try { a } catch (e) { b }')
  let restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['catch', ['try', 'a'], 'e', 'b'])

  ast = parse('try { a } finally { c }')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['finally', ['try', 'a'], 'c'])

  ast = parse('try { a } catch (e) { b } finally { c }')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['finally', ['catch', ['try', 'a'], 'e', 'b'], 'c'])
})

test('jessie: JSON roundtrip - functions', () => {
  let ast = parse('function f(a, b) { c }')
  let restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['function', 'f', [',', 'a', 'b'], 'c'])

  ast = parse('function(x) { y }')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['function', '', 'x', 'y'])

  ast = parse('x => x')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['=>', 'x', 'x'])

  ast = parse('(a, b) => a + b')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['=>', ['()', [',', 'a', 'b']], ['+', 'a', 'b']])
})

test('jessie: JSON roundtrip - property access', () => {
  let ast = parse('a.b')
  let restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['.', 'a', 'b'])

  ast = parse('a?.b')
  restored = JSON.parse(JSON.stringify(ast))
  is(restored, ['?.', 'a', 'b'])
})

test('jessie: compile from JSON-restored AST', () => {
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
