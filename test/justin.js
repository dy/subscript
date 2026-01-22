// Tests for justin preset - JSON superset expression parser
// Covers jsep-compatible cases + extensions

import test, { is, throws } from 'tst'
import { parse, nary, binary, unary } from '../justin.js'
import { compile, operator } from '../parse.js'

const justin = s => compile(parse(s))

// Helper: set custom operator
export const set = (op, prec, fn) => (
  !fn.length ? (
    nary(op, Math.abs(prec), prec < 0),
    operator(op, (...args) => (args = args.map(compile), ctx => fn(...args.map(arg => arg(ctx)))))
  ) :
    fn.length > 1 ? (
      binary(op, Math.abs(prec), prec < 0),
      operator(op,
        (a, b) => b && (a = compile(a), b = compile(b), !a.length && !b.length ? (a = fn(a(), b()), () => a) : ctx => fn(a(ctx), b(ctx)))
      )
    ) :
      (
        unary(op, prec),
        operator(op, (a, b) => !b && (a = compile(a), !a.length ? (a = fn(a()), () => a) : ctx => fn(a(ctx))))
      )
)

test('justin: exports', async () => {
  const mod = await import('../justin.js')
  is(typeof mod.parse, 'function')
  is(typeof mod.token, 'function')
  is(typeof mod.binary, 'function')
  // compile not exported - configure separately
})

test('justin: constants', () => {
  is(justin('\'abc\'')(), "abc")
  is(justin('"abc"')(), 'abc')
  is(justin('123')(), 123)
  is(justin('12.3')(), 12.3)
})

test('justin: string escapes', () => {
  is(justin("'a \\w b'")(), "a w b")
  is(justin("'a \\' b'")(), "a ' b")
  is(justin("'a \\n b'")(), "a \n b")
  is(justin("'a \\r b'")(), "a \r b")
  is(justin("'a \\t b'")(), "a \t b")
  is(justin("'a \\b b'")(), "a \b b")
  is(justin("'a \\f b'")(), "a \f b")
  is(justin("'a \\v b'")(), "a \v b")
  is(justin("'a \\\ b'")(), "a \ b")
})

test('justin: variables', () => {
  is(justin('abc')({ abc: 123 }), 123)
  is(justin('a.b[c[0]]')({ a: { b: [1] }, c: [0] }), 1)
  is(justin('Δέλτα')({ Δέλτα: 123 }), 123)
})

test('justin: booleans', () => {
  is(parse('true'), [, true])
  is(parse('false'), [, false])
  is(parse('null'), [, null])
  is(justin('true')(), true)
  is(justin('false')(), false)
  is(justin('null')(), null)
})

test('justin: JSON serialization', () => {
  // JSON primitives serialize cleanly
  is(JSON.parse(JSON.stringify(parse('true'))), [null, true])
  is(JSON.parse(JSON.stringify(parse('false'))), [null, false])
  is(JSON.parse(JSON.stringify(parse('null'))), [null, null])
  is(JSON.parse(JSON.stringify(parse('42'))), [null, 42])
  is(JSON.parse(JSON.stringify(parse('"hi"'))), [null, 'hi'])

  // undefined uses [] for JSON round-trip (compiles back to undefined)
  is(JSON.parse(JSON.stringify(parse('undefined'))), [])
  is(compile(JSON.parse(JSON.stringify(parse('undefined'))))(), undefined)

  // NaN/Infinity lose value in JSON (become null)
  is(JSON.parse(JSON.stringify(parse('NaN'))), [null, null])
  is(JSON.parse(JSON.stringify(parse('Infinity'))), [null, null])

  // Compile from JSON-restored AST
  const ast = JSON.parse(JSON.stringify(parse('1 + 2')))
  is(compile(ast)({}), 3)

  // Property access - name is token
  is(JSON.parse(JSON.stringify(parse('a.b'))), ['.', 'a', 'b'])
  is(JSON.parse(JSON.stringify(parse('a?.b'))), ['?.', 'a', 'b'])
})

test('justin: logical', () => {
  is(parse('a && b'), ['&&', 'a', 'b'])
  is(parse('a || b'), ['||', 'a', 'b'])
  is(parse('!x'), ['!', 'x'])
  is(justin('true && false')(), false)
  is(justin('true || false')(), true)
  is(justin('!false')(), true)
})

test('justin: ternary', () => {
  is(parse('a ? b : c'), ['?', 'a', 'b', 'c'])
  is(justin('1 ? 2 : 3')(), 2)
  is(justin('0 ? 2 : 3')(), 3)
})

test('justin: optional chaining', () => {
  is(justin('a?.b')({ a: { b: 1 } }), 1)
  is(justin('a?.b')({ a: 2 }), undefined)
  is(justin('a?.[1]')({ a: [, 1] }), 1)
  is(justin('a?. [1]')({ a: [, 1] }), 1)
  is(justin('a?.[1]')({}), undefined)
  is(justin('a?.(1)')({ a: v => v }), 1)
  is(justin('a?. (1)')({ a: v => v }), 1)
  is(justin('a?.(1,2)')({ a: (v, w) => v + w }), 3)
  is(justin('a?.()')({ a: v => 1 }), 1)
  is(justin('a?.(1)')({}), undefined)
  is(justin('a?.b?.(arg)?.[c] ?. d')({ a: { b: d => [, , { d }] }, arg: 1, c: 2 }), 1)
})

test('justin: nullish coalescing', () => {
  is(parse('a ?? b'), ['??', 'a', 'b'])
  is(justin('a ?? b')({ a: null, b: 'default' }), 'default')
  is(justin('a ?? b')({ a: 0, b: 'default' }), 0)
})

test('justin: arrays', () => {
  is(parse('[]')[0], '[]')
  is(parse('[1, 2]'), ['[]', [',', [, 1], [, 2]]])
  is(justin('[]')(), [])
  is(justin('[a]')({ a: 1 }), [1])
  is(justin('[1, 2, 3]')(), [1, 2, 3])
})

test('justin: objects', () => {
  is(parse('{}'), ['{}', null])
  is(parse('{a: 1}'), ['{}', [':', 'a', [, 1]]])
  is(justin('{}')(), {})
  is(justin('{a: 1}')().a, 1)
  is(justin('{a: 1, b: 2}')().b, 2)
})

test('justin: spread', () => {
  is(parse('[...a]'), ['[]', ['...', 'a']])
  is(justin('[...a]')({ a: [1, 2] }), [1, 2])
})

test('justin: arrow functions', () => {
  is(parse('x => x'), ['=>', 'x', 'x'])
  is(parse('(a, b) => a + b'), ['=>', ['()', [',', 'a', 'b']], ['+', 'a', 'b']])
  is(justin('() => 1')()(), 1)
  is(justin('(a) => a+1')()(1), 2)
  is(justin('x => x * 2')()(5), 10)
})

test('justin: function calls', () => {
  is(justin("a(b, c(d,e), f)")({ a: (b, c, f) => b + c + f, b: 1, c: (d, e) => d + e, f: 2, d: 3, e: 4 }), 10)
  throws(t => justin('a b + c'))
  is(justin("'a'.toString()")(), 'a')
  is(justin('[1].length')(), 1)
  is(justin('1;2;3')(), 3)
  is(justin('1;;')(), undefined)
  throws(t => justin('check(a b c d)'))
})

test('justin: operators', function () {
  is(justin('1')(), 1)
  is(justin('1+2')(), 3)
  is(justin('1>>2,3<<4,5>>>6')(), 0)
  is(justin('1*2')(), 2)
  is(justin('1*(2+3)')(), 5)
  is(justin('(1+2)*3')(), 9)
  is(justin('(1+2)*3+4-2-5+2/2*3')(), 9)
  is(justin('1 + 2-   3*  4 /8')(), 1.5)
  is(justin('\n1\r\n+\n2\n')(), 3)
  is(justin('1 + -2')(), -1)
  is(justin('-1 + -2 * -3 * 2')(), 11)
  is(justin('2 ** 3 ** 2')(), 512)
  is(justin('2 * (8 + 9)')(), 2 * (8 + 9))
  is(justin('2 ** 3 ** 4 * 5 ** 6 ** 7 * (8 + 9)')(), 2 ** 3 ** 4 * 5 ** 6 ** 7 * (8 + 9))
  is(justin('(2 ** 3) ** 4 * (5 ** 6 ** 7) * (8 + 9)')(), (2 ** 3) ** 4 * (5 ** 6 ** 7) * (8 + 9))
})

test.skip('justin: custom operators', () => {
  is(justin('a^b')({ a: 0xaaa, b: 0xbbb }), 0xaaa ^ 0xbbb)

  set('×', 9, (a, b) => a * b)
  is(justin('a×b')({ a: 2, b: 3 }), 6)

  set('or', 1, (a, b) => a || b)
  is(justin('oneWord or anotherWord')({ oneWord: 1, anotherWord: 0 }), 1)
  throws(() => justin('oneWord ordering anotherWord'))

  set('#', 11, (a) => [a])
  is(justin('#a')({ a: 1 }), [1])

  set('not', 13, (a) => !a)
  is(justin('not a')({ a: false }), true)

  throws(t => justin('notes 1'))

  set('and', 2, (a, b) => a && b)
  is(justin('a and b')({ a: 1, b: 2 }), 2)
  is(justin('bands')({ a: 1, b: 2 }), undefined)

  throws(t => justin('b ands'))
})

test('justin: bad numbers', () => {
  is(justin('1.')(), 1)
})

test('justin: missing arguments', () => {
  throws(() => is(justin('check(,)'), ['check', null, null]))
  throws(() => is(justin('check(,1,2)'), ['check', null, 1, 2]))
  throws(() => is(justin('check(1,,2)'), ['check', 1, null, 2]))
  throws(() => is(justin('check(1,2,)'), ['check', 1, 2, null]))
  throws(() => justin('check(a, b c d) '), 'spaced arg after 1 comma')
  throws(() => justin('check(a, b, c d)'), 'spaced arg at end')
  throws(() => justin('check(a b, c, d)'), 'spaced arg first')
  throws(() => justin('check(a b c, d)'), 'spaced args first')
})

test('justin: unclosed expression', () => {
  throws(() => console.log(justin('(a,b')))
  throws(() => console.log(justin('myFunction(a,b')), 'detects unfinished expression call')
  throws(() => justin('[1,2'), 'detects unfinished array')
  throws(() => justin('-1+2-'), 'detects trailing operator')
})

test('justin: invalid expressions', () => {
  throws(() => console.log(justin('!')))
  throws(() => console.log(justin('*x')))
  throws(() => console.log(justin('||x')))
  throws(() => console.log(justin('?a:b')))
  throws(() => console.log(justin('.')))
  throws(() => console.log(justin('()()')))
  throws(() => console.log(justin('() + 1')))
})

test('justin: esprima comparison', () => {
  is(justin(' true')(), true)
  is(justin('false ')(), false)
  is(justin(' 1.2 ')(), 1.2)
  is(justin(' .2 ')(), .2)
  is(justin('a')({ a: 'a' }), 'a')
  is(justin('a .b')({ a: { b: 1 } }), 1)
  is(justin('a.b. c')({ a: { b: { c: 1 } } }), 1)
  is(justin('a [b]')({ a: { b: 1 }, b: 'b' }), 1)
  is(justin('a.b  [ c ] ')({ a: { b: [, 1] }, c: 1 }), 1)
  is(justin('$foo[ bar][ baz].other12 [\'lawl\'][12]')({ $foo: [[, { other12: { lawl: { 12: 'abc' } } }]], bar: 0, baz: 1 }), 'abc')
  is(justin('$foo     [ 12  ] [ baz[z]    ].other12*4 + 1 ')({ $foo: { 12: [, { other12: 2 }] }, baz: [, 1], z: 1 }), 9)
  is(justin('$foo[ bar][ baz]    (a, bb ,   c  )   .other12 [\'lawl\'][12]')({ $foo: [[, (a, b, c) => ({ other12: { lawl: { 12: a + b + c } } })]], a: 1, bb: 2, c: 3, bar: 0, baz: 1 }), 6)
  is(justin('(a(b(c[!d]).e).f+\'hi\'==2) === true')({ a: _ => ({ f: 2 }), b: _ => ({ e: 1 }), c: { false: 0 }, d: 1 }), false)
  is(justin('(1,2)')(), 2)
  is(justin('(a, a + b > 2)')({ a: 1, b: 2 }), true)
  is(justin('a((1 + 2), (e > 0 ? f : g))')({ a: (v, w) => v + w, e: 1, f: 2, g: 3 }), 5)
  is(justin('(((1)))')(), 1)
  is(justin('(Object.variable.toLowerCase()).length == 3')({ Object: { variable: { toLowerCase: () => ({ length: 3 }) } } }), true)
  is(justin('(Object.variable.toLowerCase())  .  length == 3')({ Object: { variable: { toLowerCase: () => ({ length: 3 }) } } }), true)
  is(justin('"a"[0]')(), 'a')
  is(justin('"a".length')(), 1)
  is(justin('a.this')({ a: { this: 2 } }), 2)
  is(justin('a.true')({ a: { true: 1 } }), 1)
  is(justin('[1] + [2]')(), '12')
  is(justin('a[1](2)')({ a: [, x => x] }), 2)
})

test('justin: ternary compile', () => {
  is(justin('a ? b : c')({ a: 1, b: 2, c: 3 }), 2)
  is(justin('a||b ? c : d')({ a: 0, b: 0, c: 2, d: 3 }), 3)
})

test('justin: comments', () => {
  const expr = 'a // skip all this'
  is(justin(expr)({ a: 'a' }), 'a')
})

test('justin: identities', t => {
  is(justin(`a !== b`)({ a: 1, b: 2 }), true)
  is(justin(`a === b`)({ a: 1, b: '1' }), false)
  justin(`i.value.text !== item.value.text`)
})
