import test, { is, throws } from 'tst'
import { parse, compile } from '../subscript.js'
import '../feature/ternary.js'
import '../feature/template.js'

const run = (code, ctx = {}) => compile(parse(code))(ctx)

test('template: basic', t => {
  is(parse('`hello`'), [, 'hello'])
  is(run('`hello`'), 'hello')
})

test('template: interpolation', t => {
  is(parse('`a ${x} b`'), ['`', [, 'a '], 'x', [, ' b']])
  is(run('`hello ${name}!`', { name: 'world' }), 'hello world!')
  is(run('`${a} + ${b} = ${a + b}`', { a: 2, b: 3 }), '2 + 3 = 5')
})

test('template: expressions', t => {
  is(run('`result: ${x * 2}`', { x: 5 }), 'result: 10')
  is(run('`${a > b ? "yes" : "no"}`', { a: 5, b: 3 }), 'yes')
})

test('template: escapes', t => {
  is(run('`a\\nb`'), 'a\nb')
  is(run('`a\\tb`'), 'a\tb')
  is(run('`\\${x}`'), '${x}')
})

test('template: empty', t => {
  is(parse('``'), [, ''])
  is(run('``'), '')
})

test('template: nested', t => {
  is(run('`outer ${`inner ${x}`}`', { x: 1 }), 'outer inner 1')
})
