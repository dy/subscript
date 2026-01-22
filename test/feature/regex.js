import test, { is, throws } from 'tst'
import { parse, compile } from '../../subscript.js'
import '../../feature/regex.js'

const run = (code, ctx = {}) => compile(parse(code))(ctx)

test('regex: basic', t => {
  const ast = parse('/abc/')
  is(ast[0], '//')
  is(ast[1], 'abc')
  is(ast.length, 2)  // no flags
})

test('regex: flags', t => {
  is(parse('/abc/gi'), ['//', 'abc', 'gi'])
  is(parse('/test/m'), ['//', 'test', 'm'])
  is(parse('/test/i'), ['//', 'test', 'i'])
})

test('regex: escapes', t => {
  is(parse('/a\\/b/')[1], 'a\\/b')
  is(parse('/a\\nb/')[1], 'a\\nb')
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

test('regex: JSON serializable', t => {
  const ast = parse('/abc/gi')
  const json = JSON.stringify(ast)
  const restored = JSON.parse(json)
  is(restored, ['//', 'abc', 'gi'])
  // Can compile from restored AST
  const re = compile(restored)()
  is(re instanceof RegExp, true)
  is(re.source, 'abc')
  is(re.flags, 'gi')
})
