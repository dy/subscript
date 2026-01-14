// Tests for jessie ASI integration
import test, { is, throws } from 'tst'
import { parse } from '../parse/jessie.js'
import { compile } from '../compile/js.js'

const run = (s, ctx = {}) => compile(parse(s))(ctx)

test('jessie-asi: basic statements', () => {
  is(run('a = 1\nb = 2\na + b'), 3)
  is(run('x = 5\ny = x * 2\ny'), 10)
  is(run('a = 1\na'), 1)
})

test('jessie-asi: let/const', () => {
  is(run('let x = 1\nlet y = 2\nx + y'), 3)
  is(run('const a = 5\na * 2'), 10)
})

test('jessie-asi: functions', () => {
  is(run('function add(a, b) {\n  return a + b\n}\nadd(2, 3)'), 5)
  is(run('function fac(n) {\n  if (n <= 1) return 1\n  return n * fac(n - 1)\n}\nfac(5)'), 120)
})

test('jessie-asi: arrow functions', () => {
  is(run('add = (a, b) => a + b\nadd(3, 4)'), 7)
  is(run('double = x => x * 2\ndouble(5)'), 10)
})

test('jessie-asi: if/else', () => {
  is(run('x = 0\nif (true) {\n  x = 1\n}\nx'), 1)
  is(run('x = 0\nif (false) {\n  x = 1\n} else {\n  x = 2\n}\nx'), 2)
  is(run('x = 0\nif (false) x = 1\nelse x = 2\nx'), 2)
})

test('jessie-asi: for loops', () => {
  is(run('sum = 0\nfor (i = 1; i <= 5; i++) {\n  sum = sum + i\n}\nsum'), 15)
  is(run('sum = 0\nfor (i = 0; i < 3; i++) sum = sum + i\nsum'), 3)
})

test('jessie-asi: while loops', () => {
  is(run('x = 0\nwhile (x < 5) {\n  x = x + 1\n}\nx'), 5)
})

test('jessie-asi: for-of', () => {
  is(run('sum = 0\nfor (x of [1, 2, 3]) {\n  sum = sum + x\n}\nsum'), 6)
})

test('jessie-asi: try/catch', () => {
  is(run('result = 0\ntry {\n  result = 1\n} catch (e) {\n  result = -1\n}\nresult'), 1)
})

test('jessie-asi: return on its own line', () => {
  // JS ASI rule: return + newline inserts ; after return
  is(run('function f() {\n  return\n  42\n}\nf()'), undefined)
  is(run('function f() {\n  return 42\n}\nf()'), 42)
  // Newline BEFORE return should not affect return's value
  is(run('function f() {\n  x = 1\n  return x + 1\n}\nf()'), 2)
})

test('jessie-asi: break/continue', () => {
  is(run('x = 0\nfor (i = 0; i < 10; i++) {\n  if (i == 5) break\n  x = i\n}\nx'), 4)
  is(run('sum = 0\nfor (i = 0; i < 5; i++) {\n  if (i == 2) continue\n  sum = sum + i\n}\nsum'), 8) // 0+1+3+4
})

test('jessie-asi: chained member access', () => {
  // Should NOT insert ; between lines when . continues
  is(run('obj = {a: {b: {c: 42}}}\nobj\n.a\n.b\n.c'), 42)
  is(run('arr = [1, 2, 3]\narr\n.map(x => x * 2)\n.reduce((a, b) => a + b, 0)'), 12)
})

test('jessie-asi: operators across lines', () => {
  // Should NOT insert ; when operator continues
  is(run('x = 1 +\n2 +\n3'), 6)
  is(run('x = true &&\ntrue'), true)
  is(run('x = 1 ?\n2 :\n3'), 2)
})

test('jessie-asi: arrays/objects multiline', () => {
  // Should NOT insert ; inside array/object
  is(run('arr = [\n  1,\n  2,\n  3\n]\narr[1]'), 2)
  is(run('obj = {\n  a: 1,\n  b: 2\n}\nobj.a + obj.b'), 3)
})

test('jessie-asi: template literals', () => {
  is(run('x = 5\n`value: ${x}`'), 'value: 5')
  is(run('name = "world"\n`hello ${name}!`'), 'hello world!')
})

test('jessie-asi: comments', () => {
  is(run('x = 1 // comment\ny = 2\nx + y'), 3)
  is(run('// first line comment\nx = 5\nx'), 5)
})

test('jessie-asi: complex program', () => {
  const program = `
    function fibonacci(n) {
      if (n <= 1) return n
      return fibonacci(n - 1) + fibonacci(n - 2)
    }

    result = []
    for (i = 0; i < 10; i++) {
      result.push(fibonacci(i))
    }
    result
  `
  is(run(program, { result: [] }), [0, 1, 1, 2, 3, 5, 8, 13, 21, 34])
})

test('jessie-asi: edge cases', () => {
  // Empty lines should be handled
  is(run('x = 1\n\n\ny = 2\nx + y'), 3)

  // Semicolons already present should work
  is(run('x = 1;\ny = 2;\nx + y'), 3)

  // Mixed with and without semicolons
  is(run('x = 1;\ny = 2\nz = 3;\nx + y + z'), 6)
})

test('jessie-asi: instanceof/typeof', () => {
  is(run('arr = []\ntypeof arr'), 'object')
  is(run('arr = []\narr instanceof Array', { Array }), true)
})

test('jessie-asi: destructuring', () => {
  is(run('const [a, b] = [1, 2]\na + b'), 3)
  is(run('const {x, y} = {x: 5, y: 10}\nx + y'), 15)
})

test('jessie-asi: switch', () => {
  const code = `
    x = 2
    result = 0
    switch (x) {
      case 1:
        result = 10
        break
      case 2:
        result = 20
        break
      default:
        result = -1
    }
    result
  `
  is(run(code), 20)
})

console.log('\n=== All jessie-asi tests complete ===')
