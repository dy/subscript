// Compile tests - AST to closure evaluator

import test, { is, throws } from 'tst'
import '../jessie.js'
import { parse, compile } from '../parse.js'

const e = s => compile(parse(s))()
const c = (s, ctx = {}) => compile(parse(s))(ctx)

test('compile: literal', () => {
  is(e('1'), 1)
  is(e('"abc"'), 'abc')
  is(e('true'), true)
  is(e('false'), false)
  is(e('null'), null)
})

test('compile: identifier', () => {
  is(c('a', { a: 1 }), 1)
  is(c('a', { a: 2 }), 2)
})

test('compile: arithmetic', () => {
  is(e('1+2'), 3)
  is(e('1-2'), -1)
  is(e('1*2'), 2)
  is(e('1/2'), 0.5)
  is(e('1%2'), 1)
  is(e('2**3'), 8)
  is(e('(1+2)*3'), 9)
})

test('compile: unary', () => {
  is(e('+1'), 1)
  is(e('-1'), -1)
  is(e('!true'), false)
  is(e('~1'), -2)
})

test('compile: comparison', () => {
  is(e('1<2'), true)
  is(e('1>2'), false)
  is(e('1<=2'), true)
  is(e('1>=2'), false)
})

test('compile: equality', () => {
  is(e('1==1'), true)
  is(e('1!=2'), true)
  is(e('1===1'), true)
  is(e('1!==1'), false)
})

test('compile: logical', () => {
  is(e('true && true'), true)
  is(e('true && false'), false)
  is(e('true || false'), true)
  is(e('1 ?? 2'), 1)
  is(e('null ?? 2'), 2)
})

test('compile: bitwise', () => {
  is(e('1&2'), 0)
  is(e('1|2'), 3)
  is(e('1^2'), 3)
  is(e('1<<2'), 4)
  is(e('4>>2'), 1)
})

test('compile: member', () => {
  is(c('a.b', { a: { b: 1 } }), 1)
  is(c('a.b.c', { a: { b: { c: 2 } } }), 2)
  is(c('a[b]', { a: { x: 1 }, b: 'x' }), 1)
  is(c('a[0]', { a: [1, 2, 3] }), 1)
})

test('compile: optional chaining', () => {
  is(c('a?.b', { a: { b: 1 } }), 1)
  is(c('a?.b', { a: null }), undefined)
  is(c('a?.b?.c', { a: { b: { c: 1 } } }), 1)
})

test('compile: function call', () => {
  is(c('f()', { f: () => 1 }), 1)
  is(c('f(1)', { f: x => x }), 1)
  is(c('f(1,2)', { f: (a, b) => a + b }), 3)
  is(c('a.f()', { a: { f: () => 1 } }), 1)
})

test('compile: ternary', () => {
  is(e('true ? 1 : 2'), 1)
  is(e('false ? 1 : 2'), 2)
  is(e('1 < 2 ? 3 : 4'), 3)
})

test('compile: arrow', () => {
  is(e('(x => x)(1)'), 1)
  is(e('((x, y) => x + y)(1, 2)'), 3)
})

test('compile: array/object', () => {
  is(e('[]'), [])
  is(e('[1]'), [1])
  is(e('[1,2,3]'), [1, 2, 3])
  is(e('({})'), {})
  is(e('({a:1})'), { a: 1 })
})

test('compile: template', () => {
  is(e('`abc`'), 'abc')
  is(c('`a${b}c`', { b: 'x' }), 'axc')
})

test('compile: assignment', () => {
  const ctx = { a: 1 }
  c('a = 2', ctx)
  is(ctx.a, 2)
  c('a += 1', ctx)
  is(ctx.a, 3)
})

test('compile: increment', () => {
  const ctx1 = { a: 0 }
  is(c('++a', ctx1), 1)
  is(ctx1.a, 1)
  const ctx2 = { a: 0 }
  is(c('a++', ctx2), 0)
  is(ctx2.a, 1)
})

test('compile: in', () => {
  is(c('"a" in b', { b: { a: 1 } }), true)
  is(c('"x" in b', { b: { a: 1 } }), false)
})

test('compile: instanceof', () => {
  is(c('a instanceof Array', { a: [], Array }), true)
  is(c('a instanceof Object', { a: {}, Object }), true)
})

test('compile: typeof', () => {
  is(e('typeof 1'), 'number')
  is(e('typeof "a"'), 'string')
  is(e('typeof true'), 'boolean')
})

test('compile: void', () => {
  is(e('void 0'), undefined)
  is(e('void 1'), undefined)
})
