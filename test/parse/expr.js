// Tests for expr preset - minimal expression parser

import test, { is, throws } from 'tst'

test('expr: exports', async () => {
  const mod = await import('../../parse/expr.js')
  is(typeof mod.parse, 'function')
  is(typeof mod.token, 'function')
  is(typeof mod.binary, 'function')
  is(typeof mod.unary, 'function')
  is(typeof mod.nary, 'function')
  is(typeof mod.group, 'function')
  is(typeof mod.access, 'function')
  // expr has no compiler
  is(mod.compile, undefined)
})

test('expr: literals', async () => {
  const { parse } = await import('../../parse/expr.js')
  is(parse('42'), [, 42])
  is(parse('"hi"'), [, 'hi'])
  is(parse('3.14'), [, 3.14])
  is(parse('.5'), [, 0.5])
  is(parse('1e3'), [, 1000])
})

test('expr: arithmetic', async () => {
  const { parse } = await import('../../parse/expr.js')
  is(parse('1 + 2'), ['+', [, 1], [, 2]])
  is(parse('a * b'), ['*', 'a', 'b'])
  is(parse('a / b'), ['/', 'a', 'b'])
  is(parse('a % b'), ['%', 'a', 'b'])
  is(parse('-x'), ['-', 'x'])
  is(parse('+x'), ['+', 'x'])
})

test('expr: member access', async () => {
  const { parse } = await import('../../parse/expr.js')
  is(parse('a.b'), ['.', 'a', 'b'])
  is(parse('a[0]'), ['[]', 'a', [, 0]])
  is(parse('a.b.c'), ['.', ['.', 'a', 'b'], 'c'])
  is(parse('a[b][c]'), ['[]', ['[]', 'a', 'b'], 'c'])
})

test('expr: function calls', async () => {
  const { parse } = await import('../../parse/expr.js')
  is(parse('f()'), ['()', 'f', null])
  is(parse('f(x)'), ['()', 'f', 'x'])
  is(parse('f(x, y)'), ['()', 'f', [',', 'x', 'y']])
  is(parse('a.b()'), ['()', ['.', 'a', 'b'], null])
})

test('expr: grouping', async () => {
  const { parse } = await import('../../parse/expr.js')
  is(parse('(a + b)'), ['()', ['+', 'a', 'b']])
  is(parse('(a)'), ['()', 'a'])
})

test('expr: comparisons', async () => {
  const { parse } = await import('../../parse/expr.js')
  is(parse('a > b'), ['>', 'a', 'b'])
  is(parse('a < b'), ['<', 'a', 'b'])
  is(parse('a >= b'), ['>=', 'a', 'b'])
  is(parse('a <= b'), ['<=', 'a', 'b'])
  is(parse('a == b'), ['==', 'a', 'b'])
  is(parse('a != b'), ['!=', 'a', 'b'])
})

test('expr: bitwise', async () => {
  const { parse } = await import('../../parse/expr.js')
  is(parse('a | b'), ['|', 'a', 'b'])
  is(parse('a & b'), ['&', 'a', 'b'])
  is(parse('a ^ b'), ['^', 'a', 'b'])
  is(parse('~x'), ['~', 'x'])
})

test('expr: shift', async () => {
  const { parse } = await import('../../parse/expr.js')
  is(parse('a << 2'), ['<<', 'a', [, 2]])
  is(parse('a >> 2'), ['>>', 'a', [, 2]])
})

test('expr: assignment', async () => {
  const { parse } = await import('../../parse/expr.js')
  is(parse('a = 1'), ['=', 'a', [, 1]])
  is(parse('a += b'), ['+=', 'a', 'b'])
  is(parse('a -= b'), ['-=', 'a', 'b'])
})

test('expr: increment/decrement', async () => {
  const { parse } = await import('../../parse/expr.js')
  is(parse('++a'), ['++', 'a'])
  is(parse('--a'), ['--', 'a'])
  is(parse('a++'), ['++', 'a', null])
  is(parse('a--'), ['--', 'a', null])
})

test('expr: sequence', async () => {
  const { parse } = await import('../../parse/expr.js')
  is(parse('a, b'), [',', 'a', 'b'])
  is(parse('a; b'), [';', 'a', 'b'])
})
