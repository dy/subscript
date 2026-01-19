// Comprehensive jessie feature tests
import test, { is, throws } from 'tst'
import { parse, compile } from '../../subscript.js'
import '../../jessie.js'

const run = (code, ctx = {}) => compile(parse(code))(ctx)

// === try/catch/finally/throw ===

test('jessie: try basic', t => {
  is(parse('try { x }')[0], 'try')
  is(parse('try { x }')[1], 'x')
})

test('jessie: try-catch', t => {
  const ast = parse('try { x } catch (e) { y }')
  is(ast[0], 'catch')
  is(ast[1][0], 'try')
  is(ast[2], 'e')
  is(ast[3], 'y')
})

test('jessie: try-finally', t => {
  const ast = parse('try { x } finally { y }')
  is(ast[0], 'finally')
  is(ast[1][0], 'try')
  is(ast[2], 'y')
})

test('jessie: try-catch-finally', t => {
  const ast = parse('try { a } catch (e) { b } finally { c }')
  is(ast[0], 'finally')
  is(ast[1][0], 'catch')
  is(ast[2], 'c')
})

test('jessie: throw', t => {
  is(parse('throw x')[0], 'throw')
  is(parse('throw x')[1], 'x')
  is(parse('throw new Error()')[0], 'throw')
})

test('jessie: try-catch compile', t => {
  // No error - try body runs
  let ctx = { r: 0 }
  run('try { r = 1 } catch (e) { r = 2 }', ctx)
  is(ctx.r, 1)

  // Error caught
  ctx = { r: 0, err: null }
  run('try { throw "oops" } catch (e) { err = e; r = 2 }', ctx)
  is(ctx.r, 2)
  is(ctx.err, 'oops')
})

test('jessie: finally always runs', t => {
  let ctx = { r: 0, f: 0 }
  run('try { r = 1 } finally { f = 1 }', ctx)
  is(ctx.r, 1)
  is(ctx.f, 1)

  // Finally runs even after catch
  ctx = { r: 0, f: 0 }
  run('try { throw 1 } catch (e) { r = e } finally { f = 1 }', ctx)
  is(ctx.r, 1)
  is(ctx.f, 1)
})

// === function declaration ===

test('jessie: function declaration', t => {
  const ast = parse('function f(a) { return a }')
  is(ast[0], 'function')
  is(ast[1], 'f')
  is(ast[2], 'a')
  is(ast[3][0], 'return')
})

test('jessie: function anonymous', t => {
  const ast = parse('function () { x }')
  is(ast[0], 'function')
  is(ast[1], '')
  is(ast[2], null)
  is(ast[3], 'x')
})

test('jessie: function multiple params', t => {
  const ast = parse('function add(a, b) { return a + b }')
  is(ast[0], 'function')
  is(ast[2][0], ',')
  is(ast[2][1], 'a')
  is(ast[2][2], 'b')
})

test('jessie: function compile', t => {
  let ctx = {}
  run('function double(x) { return x * 2 }', ctx)
  is(typeof ctx.double, 'function')
  is(ctx.double(5), 10)

  // Function with closure
  ctx = { factor: 3 }
  run('function mult(x) { return x * factor }', ctx)
  is(ctx.mult(4), 12)
})

test('jessie: early return', t => {
  // Standalone if with return (guard clause pattern)
  let ctx = {}
  run('function guard(x) { if (x < 0) return -1; return x * 2 }', ctx)
  is(ctx.guard(-5), -1, 'early return on negative')
  is(ctx.guard(5), 10, 'normal path')

  // Multiple early returns
  ctx = {}
  run('function grade(s) { if (s >= 90) return "A"; if (s >= 80) return "B"; return "C" }', ctx)
  is(ctx.grade(95), 'A')
  is(ctx.grade(85), 'B')
  is(ctx.grade(70), 'C')

  // Early return with no value
  ctx = { called: false }
  run('function maybe(x) { if (!x) return; called = true }', ctx)
  ctx.maybe(false)
  is(ctx.called, false, 'early return prevented side effect')
  ctx.maybe(true)
  is(ctx.called, true, 'no early return, side effect happened')
})

test('jessie: standalone if statement', t => {
  // if without else, single statement body
  is(parse('if (x) y')[0], 'if')
  is(parse('if (x) y').length, 3, 'no else branch')

  // if with return (common guard pattern)
  const ast = parse('if (x < 0) return -1')
  is(ast[0], 'if')
  is(ast[2][0], 'return')

  // Compile standalone if
  let ctx = { x: true, y: 0 }
  run('if (x) y = 1', ctx)
  is(ctx.y, 1)

  ctx = { x: false, y: 0 }
  run('if (x) y = 1', ctx)
  is(ctx.y, 0, 'false condition skips body')
})

test('jessie: function rest param', t => {
  const ast = parse('function f(a, ...rest) { return rest }')
  is(ast[2][0], ',')
  is(ast[2][2][0], '...')

  let ctx = {}
  run('function sum(first, ...nums) { let t = first; for (let n of nums) t = t + n; return t }', ctx)
  is(ctx.sum(1, 2, 3, 4), 10)
})

// === destructuring ===

test('jessie: array destructure', t => {
  let ctx = {}
  run('let [a, b] = [1, 2]', ctx)
  is(ctx.a, 1)
  is(ctx.b, 2)
})

test('jessie: array destructure skip', t => {
  let ctx = {}
  run('let [a, , c] = [1, 2, 3]', ctx)
  is(ctx.a, 1)
  is(ctx.c, 3)
})

test('jessie: array destructure rest', t => {
  let ctx = {}
  run('let [first, ...rest] = [1, 2, 3, 4]', ctx)
  is(ctx.first, 1)
  is(ctx.rest.join(','), '2,3,4')
})

test('jessie: object destructure', t => {
  let ctx = { obj: { x: 10, y: 20 } }
  run('let {x, y} = obj', ctx)
  is(ctx.x, 10)
  is(ctx.y, 20)
})

test('jessie: object destructure rename', t => {
  let ctx = { obj: { x: 10 } }
  run('let {x: renamed} = obj', ctx)
  is(ctx.renamed, 10)
})

test('jessie: destructure default value', t => {
  let ctx = {}
  run('let [a, b = 99] = [1]', ctx)
  is(ctx.a, 1)
  is(ctx.b, 99)

  ctx = { obj: { x: 10 } }
  run('let {x, y = 42} = obj', ctx)
  is(ctx.x, 10)
  is(ctx.y, 42)
})

// === module syntax (parse only) ===

test('jessie: import path', t => {
  const ast = parse("import './module.js'")
  is(ast[0], 'import')
  is(ast[1][1], './module.js')
})

test('jessie: import default', t => {
  const ast = parse("import X from './x.js'")
  is(ast[0], 'import')
  is(ast[1][0], 'from')
  is(ast[1][1], 'X')
})

test('jessie: import named', t => {
  const ast = parse("import { a, b } from './x.js'")
  is(ast[0], 'import')
  is(ast[1][0], 'from')
  is(ast[1][1][0], '{}')
})

test('jessie: import star', t => {
  const ast = parse("import * as M from './x.js'")
  is(ast[0], 'import')
  is(ast[1][1][0], 'as')
  is(ast[1][1][1], '*')
  is(ast[1][1][2], 'M')
})

test('jessie: export const', t => {
  const ast = parse('export const x = 1')
  is(ast[0], 'export')
  is(ast[1][0], 'const')
})

test('jessie: export default', t => {
  const ast = parse('export default x')
  is(ast[0], 'export')
  is(ast[1][0], 'default')
})

test('jessie: export from', t => {
  const ast = parse("export { a } from './x.js'")
  is(ast[0], 'export')
  is(ast[1][0], 'from')
})

// === for-of ===

test('jessie: for-of', t => {
  const ast = parse('for (let x of arr) y')
  is(ast[0], 'for')
  is(ast[1][0], 'of')
  is(ast[1][1][0], 'let')

  let ctx = { arr: [1, 2, 3], sum: 0 }
  run('for (let x of arr) sum = sum + x', ctx)
  is(ctx.sum, 6)
})

// === accessor get/set ===

test('jessie: get accessor', t => {
  const ast = parse('get x() { return 1 }')
  is(ast[0], 'get')
  is(ast[1], 'x')
})

test('jessie: set accessor', t => {
  const ast = parse('set x(v) { y = v }')
  is(ast[0], 'set')
  is(ast[1], 'x')
  is(ast[2], 'v')
})

// === ASI (automatic semicolon insertion) ===

test('jessie: ASI basic', t => {
  // Newline acts as statement separator
  const ast = parse('a\nb')
  is(ast[0], ';')
  is(ast[1], 'a')
  is(ast[2], 'b')
})

test('jessie: ASI return', t => {
  // Return on its own line
  const ast = parse('return\nx')
  is(ast[0], ';')
  is(ast[1][0], 'return')
  is(ast[2], 'x')
})
