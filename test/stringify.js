// Stringify tests - AST to JS source codegen

import test, { is } from 'tst'
import '../jessie.js'
import { parse } from '../parse.js'
import { codegen } from '../util/stringify.js'

const gen = s => codegen(parse(s))

test('stringify: literal', () => {
  is(gen('1'), '1')
  is(gen('"abc"'), '"abc"')
  is(gen('true'), 'true')
  is(gen('false'), 'false')
  is(gen('null'), 'null')
})

test('stringify: identifier', () => {
  is(gen('a'), 'a')
  is(gen('abc'), 'abc')
})

test('stringify: arithmetic', () => {
  is(gen('1+2'), '1 + 2')
  is(gen('1-2'), '1 - 2')
  is(gen('1*2'), '1 * 2')
  is(gen('1/2'), '1 / 2')
  is(gen('1%2'), '1 % 2')
  is(gen('2**3'), '2 ** 3')
})

test('stringify: comparison', () => {
  is(gen('a<b'), 'a < b')
  is(gen('a>b'), 'a > b')
  is(gen('a<=b'), 'a <= b')
  is(gen('a>=b'), 'a >= b')
})

test('stringify: equality', () => {
  is(gen('a==b'), 'a == b')
  is(gen('a!=b'), 'a != b')
  is(gen('a===b'), 'a === b')
  is(gen('a!==b'), 'a !== b')
})

test('stringify: logical', () => {
  is(gen('a&&b'), 'a && b')
  is(gen('a||b'), 'a || b')
  is(gen('a??b'), 'a ?? b')
  is(gen('!a'), '!a')
})

test('stringify: bitwise', () => {
  is(gen('a&b'), 'a & b')
  is(gen('a|b'), 'a | b')
  is(gen('a^b'), 'a ^ b')
  is(gen('a<<b'), 'a << b')
  is(gen('a>>b'), 'a >> b')
  is(gen('~a'), '~a')
})

test('stringify: member', () => {
  is(gen('a.b'), 'a.b')
  is(gen('a.b.c'), 'a.b.c')
  is(gen('a[b]'), 'a[b]')
  is(gen('a[0]'), 'a[0]')
})

test('stringify: call', () => {
  is(gen('f()'), 'f()')
  is(gen('f(1)'), 'f(1)')
  is(gen('f(1,2)'), 'f(1, 2)')
  is(gen('a.f()'), 'a.f()')
})

test('stringify: unary', () => {
  is(gen('+a'), '+a')
  is(gen('-a'), '-a')
  is(gen('!a'), '!a')
  is(gen('~a'), '~a')
})

test('stringify: ternary', () => {
  is(gen('a?b:c'), 'a ? b : c')
})

test('stringify: assignment', () => {
  is(gen('a=b'), 'a = b')
  is(gen('a+=b'), 'a += b')
  is(gen('a-=b'), 'a -= b')
})

test('stringify: array', () => {
  is(gen('[]'), '[]')
  is(gen('[1]'), '[1]')
  is(gen('[1,2]'), '[1, 2]')
  is(gen('[1,2,3]'), '[1, 2, 3]')
})

test('stringify: object', () => {
  is(gen('({})'), '({})')
  is(gen('({a:1})'), '({a: 1})')
  is(gen('({a:1,b:2})'), '({a: 1, b: 2})')
})

test('stringify: arrow', () => {
  is(gen('x=>x'), 'x => x')
  is(gen('(x)=>x'), 'x => x')
  is(gen('(x,y)=>x+y'), '(x, y) => x + y')
})

test('stringify: template', () => {
  // Templates are compiled to strings by default
  is(gen('`abc`'), '"abc"')
})

test('stringify: var', () => {
  is(gen('let a'), 'let a')
  is(gen('let a=1'), 'let a = 1')
  is(gen('const a=1'), 'const a = 1')
})

test('stringify: if', () => {
  is(gen('if(a)b'), 'if (a) { b }')
  is(gen('if(a)b;else c'), 'if (a) { b } else { c }')
})

test('stringify: for', () => {
  is(gen('for(;;)a'), 'for (; ; ) { a }')
  is(gen('for(let i=0;i<10;i++)a'), 'for (let i = 0; i < 10; i++) { a }')
})

test('stringify: while', () => {
  is(gen('while(a)b'), 'while (a) { b }')
})

test('stringify: return', () => {
  is(gen('return'), 'return')
  is(gen('return a'), 'return a')
})

test('stringify: function', () => {
  is(gen('function f(){}'), 'function f() {  }')
  is(gen('function f(a){}'), 'function f(a) {  }')
  is(gen('function f(a,b){}'), 'function f(a, b) {  }')
})

test('stringify: sequence', () => {
  is(gen('a,b'), 'a, b')
  is(gen('a,b,c'), 'a, b, c')
})

test('stringify: regex', () => {
  is(gen('/abc/'), '/abc/')
  is(gen('/abc/gi'), '/abc/gi')
  is(gen('/a\\/b/'), '/a\\/b/')
})
