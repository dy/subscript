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

test('template: tagged', t => {
  is(parse('tag`hello`'), ['``', 'tag', [, 'hello']])
  is(parse('tag`a ${x} b`'), ['``', 'tag', [, 'a '], 'x', [, ' b']])

  // Test tagged template execution
  const upper = (strings, ...values) =>
    strings.reduce((acc, str, i) => acc + str + (values[i]?.toString().toUpperCase() || ''), '')
  is(run('tag`hello ${name}!`', { tag: upper, name: 'world' }), 'hello WORLD!')
})

test('template: tagged with member access', t => {
  is(parse('a.b`hello`'), ['``', ['.', 'a', 'b'], [, 'hello']])

  // Test compile
  const upper = (strings, ...values) =>
    strings.reduce((acc, str, i) => acc + str + (values[i]?.toString().toUpperCase() || ''), '')
  is(run('obj.tag`hi ${x}!`', { obj: { tag: upper }, x: 'there' }), 'hi THERE!')
})
