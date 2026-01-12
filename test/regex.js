import test, { is, throws } from 'tst'
import { parse, compile } from '../subscript.js'
import '../feature/regex.js'

const run = (code, ctx = {}) => compile(parse(code))(ctx)

test('regex: basic', t => {
  const ast = parse('/abc/')
  is(ast[0], undefined)
  is(ast[1] instanceof RegExp, true)
  is(ast[1].source, 'abc')
})

test('regex: flags', t => {
  is(parse('/abc/gi')[1].flags, 'gi')
  is(parse('/test/m')[1].multiline, true)
  is(parse('/test/i')[1].ignoreCase, true)
})

test('regex: escapes', t => {
  is(parse('/a\\/b/')[1].source, 'a\\/b')
  is(parse('/a\\nb/')[1].source, 'a\\nb')
})

test('regex: eval', t => {
  is(run('/abc/.test("abc")'), true)
  is(run('/abc/.test("def")'), false)
  is(run('"hello world".match(/\\w+/g)'), ['hello', 'world'])
})

test('regex: division disambiguation', t => {
  // Division when left operand exists
  is(run('4 / 2'), 2)
  is(run('a / b', { a: 10, b: 2 }), 5)

  // Regex when no left operand
  is(run('/a/.test("a")'), true)
})

test('regex: in expressions', t => {
  is(run('x.match(/\\d+/)', { x: 'abc123def' })[0], '123')
  is(run('x.replace(/a/g, "b")', { x: 'aaa' }), 'bbb')
})
