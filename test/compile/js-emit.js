// Tests for js-emit.js (AST → JS source string)

import test, { is, throws } from 'tst'
import { codegen, generator, generators } from '../../compile/js-emit.js'
import parse from '../../parse/pratt.js'
import '../../parse/jessie.js'

// Helper: parse and codegen
const gen = s => codegen(parse(s))

test('codegen: literals', t => {
  is(codegen([, 1]), '1')
  is(codegen([, 0]), '0')
  is(codegen([, -1]), '-1')
  is(codegen([, 1.5]), '1.5')
  is(codegen([, 'hello']), '"hello"')
  is(codegen([, '']), '""')
  is(codegen([, true]), 'true')
  is(codegen([, false]), 'false')
  is(codegen([, null]), 'null')
})

test('codegen: identifiers', t => {
  is(codegen('x'), 'x')
  is(codegen('foo'), 'foo')
  is(codegen('_private'), '_private')
  is(codegen(undefined), 'undefined')
})

test('codegen: arithmetic', t => {
  is(gen('1 + 2'), '(1 + 2)')
  is(gen('a - b'), '(a - b)')
  is(gen('x * y'), '(x * y)')
  is(gen('a / b'), '(a / b)')
  is(gen('n % 2'), '(n % 2)')
  is(gen('-x'), '(-x)')
  is(gen('1 + 2 + 3'), '((1 + 2) + 3)')
  is(gen('a + b * c'), '(a + (b * c))')
})

test('codegen: comparison', t => {
  is(gen('a == b'), '(a == b)')
  is(gen('a != b'), '(a != b)')
  is(gen('a === b'), '(a === b)')
  is(gen('a !== b'), '(a !== b)')
  is(gen('a > b'), '(a > b)')
  is(gen('a < b'), '(a < b)')
  is(gen('a >= b'), '(a >= b)')
  is(gen('a <= b'), '(a <= b)')
})

test('codegen: logical', t => {
  is(gen('a || b'), '(a || b)')
  is(gen('a && b'), '(a && b)')
  is(gen('!x'), '(!x)')
  is(gen('a && b || c'), '((a && b) || c)')
  is(gen('!(a && b)'), '(!((a && b)))')  // Extra parens from grouping
})

test('codegen: bitwise', t => {
  is(gen('a | b'), '(a | b)')
  is(gen('a & b'), '(a & b)')
  is(gen('a ^ b'), '(a ^ b)')
  is(gen('~x'), '(~x)')
  is(gen('a << 2'), '(a << 2)')
  is(gen('a >> 2'), '(a >> 2)')
  is(gen('a >>> 2'), '(a >>> 2)')
})

test('codegen: member access', t => {
  is(gen('a.b'), 'a.b')
  is(gen('a.b.c'), 'a.b.c')
  is(gen('a[0]'), 'a[0]')
  is(gen('a[b]'), 'a[b]')
  is(gen('a["key"]'), 'a["key"]')
  is(gen('a.b[c]'), 'a.b[c]')
})

test('codegen: arrays', t => {
  is(gen('[]'), '[]')
  is(gen('[1]'), '[1]')
  is(gen('[1, 2, 3]'), '[1, 2, 3]')
  is(gen('[a, b]'), '[a, b]')
})

test('codegen: objects', t => {
  is(gen('{}'), '{}')
  is(gen('{a: 1}'), '{a: 1}')
  is(gen('{a: 1, b: 2}'), '{a: 1, b: 2}')
  is(gen('{a}'), '{a}')  // shorthand
})

test('codegen: function calls', t => {
  is(gen('f()'), 'f()')
  is(gen('f(x)'), 'f(x)')
  is(gen('f(a, b)'), 'f(a, b)')
  is(gen('f(1, 2, 3)'), 'f(1, 2, 3)')
  is(gen('a.b()'), 'a.b()')
  is(gen('a.b(c)'), 'a.b(c)')
  is(gen('f(g(x))'), 'f(g(x))')
})

test('codegen: grouping', t => {
  is(gen('(a)'), '(a)')
  is(gen('(a + b)'), '((a + b))')
  is(gen('(a + b) * c'), '(((a + b)) * c)')
})

test('codegen: ternary', t => {
  is(gen('a ? b : c'), '(a ? b : c)')
  is(gen('x > 0 ? x : -x'), '((x > 0) ? x : (-x))')
})

test('codegen: assignment', t => {
  is(gen('a = 1'), 'a = 1')
  is(gen('a = b + c'), 'a = (b + c)')
})

test('codegen: variables', t => {
  is(codegen(['let', 'x', [, 1]]), 'let x = 1')
  is(codegen(['let', 'x']), 'let x')
  is(codegen(['const', 'x', [, 1]]), 'const x = 1')
  is(codegen(['var', 'x', [, 1]]), 'var x = 1')
})

test('codegen: if', t => {
  is(codegen(['if', 'x', ['block', 'y']]), 'if (x) { y }')
  is(codegen(['if', 'x', ['block', 'y'], ['block', 'z']]), 'if (x) { y } else { z }')
})

test('codegen: loops', t => {
  is(codegen(['while', 'x', ['block', 'y']]), 'while (x) { y }')
  is(codegen(['for', [';', ['let', 'i', [, 0]], ['<', 'i', [, 10]], ['=', 'i', ['+', 'i', [, 1]]]], ['block', 'x']]),
    'for (let i = 0; (i < 10); i = (i + 1)) { x }')
})

test('codegen: control flow', t => {
  is(codegen(['return']), 'return')
  is(codegen(['return', [, 1]]), 'return 1')
  is(codegen(['return', 'x']), 'return x')
  is(codegen(['break']), 'break')
  is(codegen(['continue']), 'continue')
})

test('codegen: functions', t => {
  is(codegen(['function', 'foo', null, ['block', ['return', [, 1]]]]), 'function foo() { return 1 }')
  is(codegen(['function', 'foo', 'x', ['block', ['return', 'x']]]), 'function foo(x) { return x }')
  is(codegen(['function', 'foo', [',', 'a', 'b'], ['block', ['return', ['+', 'a', 'b']]]]),
    'function foo(a, b) { return (a + b) }')
  // Anonymous
  is(codegen(['function', null, null, ['block', ['return', [, 1]]]]), 'function() { return 1 }')
})

test('codegen: arrow functions', t => {
  is(codegen(['=>', null, [, 1]]), '() => 1')
  is(codegen(['=>', 'x', 'x']), 'x => x')
  is(codegen(['=>', [',', 'a', 'b'], ['+', 'a', 'b']]), '(a, b) => (a + b)')
})

test('codegen: sequence', t => {
  is(codegen([',', 'a', 'b']), 'a, b')
  is(codegen([',', 'a', 'b', 'c']), 'a, b, c')
  is(codegen([';', 'a', 'b']), 'a; b')
})

test('codegen: block', t => {
  is(codegen(['block']), '{}')
  is(codegen(['block', 'x']), '{ x }')
  is(codegen(['block', [';', 'x', 'y']]), '{ x; y }')
})

test('codegen: extensibility', t => {
  // Test that we can add custom generators
  generator('custom_op', (a, b) => `CUSTOM(${codegen(a)}, ${codegen(b)})`)
  is(codegen(['custom_op', 'x', 'y']), 'CUSTOM(x, y)')

  // Clean up
  delete generators['custom_op']
})

test('codegen: unknown operator throws', t => {
  throws(() => codegen(['unknown_op_xyz', 'a']))
})

test('codegen: round-trip parse->codegen', t => {
  // These should produce valid JS that can be eval'd
  const cases = [
    '1 + 2',
    'a && b || c',
    'x > 0 ? x : -x',
    '!a',
    'a.b.c',
    'f(x, y)',
    '[1, 2, 3]',
    '{a: 1}',
  ]
  for (const expr of cases) {
    const ast = parse(expr)
    const code = codegen(ast)
    // Just verify it doesn't throw and produces a string
    is(typeof code, 'string')
  }
})
