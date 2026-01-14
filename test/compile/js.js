// Tests for compile/js.js - AST → closure evaluator (direct AST input)

import test, { is, throws } from 'tst'
import { compile, operator, operators } from '../../compile/js.js'

// Test compile directly with AST (no parsing)
test('compile: literals', t => {
  is(compile([, 1])(), 1)
  is(compile([, 0])(), 0)
  is(compile([, 'hello'])(), 'hello')
  is(compile([, true])(), true)
  is(compile([, false])(), false)
  is(compile([, null])(), null)
})

test('compile: identifiers', t => {
  is(compile('x')({ x: 42 }), 42)
  is(compile('foo')({ foo: 'bar' }), 'bar')
  is(compile(undefined)({}), undefined)
})

test('compile: arithmetic', t => {
  is(compile(['+', [, 1], [, 2]])(), 3)
  is(compile(['-', [, 5], [, 3]])(), 2)
  is(compile(['*', [, 4], [, 3]])(), 12)
  is(compile(['/', [, 10], [, 2]])(), 5)
  is(compile(['%', [, 7], [, 3]])(), 1)
})

test('compile: unary', t => {
  is(compile(['-', [, 5]])(), -5)
  is(compile(['+', [, 5]])(), 5)
  is(compile(['!', [, true]])(), false)
  is(compile(['!', [, false]])(), true)
  is(compile(['~', [, 5]])(), ~5)
})

test('compile: comparison', t => {
  is(compile(['<', [, 1], [, 2]])(), true)
  is(compile(['>', [, 2], [, 1]])(), true)
  is(compile(['<=', [, 2], [, 2]])(), true)
  is(compile(['>=', [, 2], [, 2]])(), true)
  is(compile(['==', [, 1], [, 1]])(), true)
  is(compile(['!=', [, 1], [, 2]])(), true)
  is(compile(['===', [, 1], [, 1]])(), true)
  is(compile(['!==', [, 1], [, '1']])(), true)
})

test('compile: logical', t => {
  is(compile(['&&', [, true], [, false]])(), false)
  is(compile(['||', [, false], [, true]])(), true)
  is(compile(['??', [, null], [, 42]])(), 42)
})

test('compile: bitwise', t => {
  is(compile(['&', [, 5], [, 3]])(), 1)
  is(compile(['|', [, 5], [, 3]])(), 7)
  is(compile(['^', [, 5], [, 3]])(), 6)
  is(compile(['<<', [, 2], [, 3]])(), 16)
  is(compile(['>>', [, 16], [, 2]])(), 4)
})

test('compile: member access', t => {
  is(compile(['.', 'a', 'b'])({ a: { b: 42 } }), 42)
  is(compile(['[]', 'a', [, 'x']])({ a: { x: 1 } }), 1)
  is(compile(['[]', 'a', 'k'])({ a: { y: 2 }, k: 'y' }), 2)
})

test('compile: function call', t => {
  is(compile(['()', 'fn', [, 1]])({ fn: x => x * 2 }), 2)
  is(compile(['()', 'fn', [',', [, 1], [, 2]]])({ fn: (a, b) => a + b }), 3)
})

test('compile: ternary', t => {
  is(compile(['?', [, true], [, 1], [, 2]])(), 1)
  is(compile(['?', [, false], [, 1], [, 2]])(), 2)
})

test('compile: assignment', t => {
  let ctx = { x: 0 }
  compile(['=', 'x', [, 5]])(ctx)
  is(ctx.x, 5)

  ctx = { x: 10 }
  compile(['+=', 'x', [, 5]])(ctx)
  is(ctx.x, 15)
})

test('compile: sequence', t => {
  is(compile([',', [, 1], [, 2], [, 3]])(), 3)
})

test('compile: array literal', t => {
  is(compile(['[]', [',', [, 1], [, 2], [, 3]]])().length, 3)
  is(compile(['[]', [',', [, 1], [, 2]]])()[0], 1)
})

test('compile: object literal', t => {
  const obj = compile(['{}', [':', 'a', [, 1]]])()
  is(obj.a, 1)
})

test('compile: arrow function', t => {
  const fn = compile(['=>', 'x', ['*', 'x', [, 2]]])()
  is(fn(5), 10)

  const fn2 = compile(['=>', [',', 'a', 'b'], ['+', 'a', 'b']])()
  is(fn2(3, 4), 7)
})

test('compile: increment/decrement', t => {
  let ctx = { x: 5 }
  is(compile(['++', 'x'])(ctx), 6)
  is(ctx.x, 6)

  // Postfix: ['++', 'x', null] means x++
  ctx = { x: 5 }
  is(compile(['++', 'x', null])(ctx), 5)
  is(ctx.x, 6)

  ctx = { x: 5 }
  is(compile(['--', 'x'])(ctx), 4)
  is(ctx.x, 4)
})

test('compile: typeof', t => {
  is(compile(['typeof', [, 42]])(), 'number')
  is(compile(['typeof', [, 'hello']])(), 'string')
  is(compile(['typeof', 'x'])({ x: {} }), 'object')
})

test('compile: unknown operator throws', t => {
  throws(() => compile(['$$$', 'a', 'b']), /Unknown operator/)
})

test('compile: operator extension', t => {
  // Register custom operator - fn receives AST args and returns evaluator
  operator('custom_test_op', (a, b) => {
    const aFn = compile(a), bFn = compile(b)
    return ctx => aFn(ctx) + '-' + bFn(ctx)
  })

  is(compile(['custom_test_op', [, 'hello'], [, 'world']])(), 'hello-world')

  // Clean up
  delete operators['custom_test_op']
})
