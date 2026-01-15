// Tests for subscript.js - combined jessie parser + JS compiler pipeline

import test, { is, throws, same } from 'tst'
import parse, { err, unary, lookup } from '../parse/pratt.js'
import subscript, { binary, operator, compile, token } from '../subscript.js'
import { operators } from '../compile/js.js'

const MULT = 120;

// Test result to be same as js
const sameAsJs = (str, ctx = {}) => {
  let ss = subscript(str), fn = new Function(...Object.keys(ctx), 'return ' + str)
  return is(ss(ctx), fn(...Object.values(ctx)))
}

test('basic', t => {
  is(subscript('1 + 2')(), 3)
  is(subscript('1 + 2 + 3')(), 6)
  is(subscript('1 + 2 * 3')(), 7)
  is(subscript('2 * 3 % 4')(), 2)
  is(subscript('2 % 3 * 4')(), 8)
  is(subscript('1 + 2 + 3 + 4')(), 10)
  is(subscript('1 * 2 + 3')(), 5)
  is(subscript('1 + 2 * 3 + 4')(), 11)
  is(subscript(`(1+2)`)(), 3)
  is(subscript(`1+(2+3)`)(), 6)
  is(subscript(`1+(2)`)(), 3)
  is(subscript(`1+(2)+3+((4))`)(), 10)
  is(subscript(`-2`)(), -2)
  sameAsJs('0 + 1 + 2.0')
  sameAsJs('0 + (1 + 2)')
  sameAsJs('-2 - 2')
  sameAsJs('0 + 1 - 2')
  sameAsJs('0 - 1 + 2')
  sameAsJs('0 + 1 + 2 - 1 - 2 + 1')
  sameAsJs('0 * 1 * 2 / 1 / 2 * 1')
  sameAsJs('0 + 1 - 2 * 3')
  sameAsJs('1 * 2 - 3')
  is(subscript(`a`)({ a: 1 }), 1)
  is(subscript(`a()`)({ a: v => 1 }), 1)
  is(subscript(`a( )`)({ a: v => 1 }), 1)
  is(subscript(`a(1)`)({ a: v => v }), 1)
  is(subscript(`a.b`)({ a: { b: 1 } }), 1)
  is(subscript(`a . b`)({ a: { b: 1 } }), 1)
  is(subscript('a.b.c')({ a: { b: { c: 1 } } }), 1)
  is(subscript(`a(1).b`)({ a: v => ({ b: v }) }), 1)
  is(subscript(`a ( c ) . e`)({ a: v => ({ e: v }), c: 1 }), 1)
  is(subscript('a[b][c]')({ a: { b: { c: 1 } }, b: 'b', c: 'c' }), 1)
  is(subscript('a.b.c(d).e')({ a: { b: { c: e => ({ e }) } }, d: 1 }), 1)
  is(subscript(`+-2`)(), -2)
  is(subscript(`+-a.b`)({ a: { b: 1 } }), -1)
  is(subscript(`1+-2`)(), -1)
  is(subscript(`-a.b+1`)({ a: { b: 1 } }), 0)
  is(subscript(`-a-b`)({ a: 1, b: 2 }), -3)
  is(subscript(`+-a.b+-!1`)({ a: { b: 1 } }), -1)

  is(subscript(`a++ +1`)({ a: 1 }), 2)

  is(subscript(`   .1   +   -1.0 -  2.3e+1 `)(), .1 - 1.0 - 2.3e+1)
  is(subscript(`( a,  b )`)({ a: 1, b: 2 }), 2)
  is(subscript(`a( b,  (c, d) )`)({ a: (b, c) => b + c, b: 2, c: 3, d: 4 }), 6)

  sameAsJs('a.b', { a: { b: 2 } })
  sameAsJs('1 + a.b + 3.5', { a: { b: 3 } })
  sameAsJs('1 + (a.b + 3.5)', { a: { b: 4 } })
  sameAsJs(`a (  ccc. d,  -+1.0 )`, { a: (b, c) => b + c, ccc: { d: 1 } })
  sameAsJs(`a.b (  ccc. d , -+1.0 ) . e`, { a: { b: (c, d) => ({ e: c + d }) }, ccc: { d: 10 } })
  sameAsJs(`a * 3 / 2`, { a: 42 })
  sameAsJs(`(a + 2) * 3 / 2 + b * 2 - 1`, { a: 12, b: 13 })
  sameAsJs('a()()()', { a: b => c => d => 2 })
  sameAsJs('a(b)(c)', { a: x => y => x + y, b: 2, c: 3 })

  sameAsJs(`"abcd" + "efgh"`)

  sameAsJs('x(a + 3)', { x: v => v + 1, a: 3 })
  sameAsJs('1 + x(a.b + 3.5)', { x: v => v + 1, a: { b: 1 } })
  sameAsJs('a[b]', { a: { x: 1 }, b: 'x' })
  sameAsJs('(a(b) + 3.5)', { a: v => v * 2, b: 3 })
  sameAsJs('1 + x(a[b] + 3.5)', { x: v => v + 1, a: { y: 1 }, b: 'y' })
  is(subscript('x.y.z,123')({ x: { y: { z: 345 } } }), 123)
  sameAsJs('x.y.z(123)', { x: { y: { z: x => x } } })
  sameAsJs('x.y.z(123 + c[456]) + n', { x: { y: { z: v => v + 1 } }, c: { 456: 789 }, n: 1 })
  sameAsJs('1 || 1')
  sameAsJs('-1%2')
  sameAsJs('-(1%2)')
  sameAsJs('+1 * (a.b - 3.5) - "asdf" || x.y.z(123 + c[456]) + n', { a: { b: 1 }, x: { y: { z: v => v } }, c: { 456: 789 }, n: 1 })
})

test('right-assoc', async t => {
  // ** is now in consolidated op.js (imported via expr.js)
  sameAsJs('1 + 2 * 3 ** 4 + 5', {})
  sameAsJs(`a + b * c ** d | e`, { a: 1, b: 2, c: 3, d: 4, e: 5 })
})

test('syntactic', t => {
  is(parse(''), '')
  is(subscript('')(), undefined)
  is(subscript(' ')(), undefined)
  is(subscript('\n\r')(), undefined)
})

test('numbers', t => {
  is(subscript('1')(), 1)
  is(subscript('42')(), 42)
  is(subscript('3.14')(), 3.14)
  is(subscript('.1')(), .1)
  is(subscript('0.1')(), 0.1)
  is(subscript('0.1E+3')(), 0.1E+3)
  is(subscript('1E-3')(), 1E-3)
})

test('strings', t => {
  is(subscript('"a"')(), 'a')
  throws(x => subscript('"a'))
  throws(x => subscript('"a" + "b'))
  is(subscript('"a" + ("1" + "2")')(), "a12")
})

test('ext: literals', t => {
  token('null', 20, a => a ? err() : [, null])
  token('true', 20, a => a ? err() : [, true])
  token('false', 20, a => a ? err() : [, false])
  token('undefined', 20, a => a ? err() : [, undefined])

  is(subscript('null')({}), null)
  is(subscript('(null)')({}), null)
  is(subscript('!null')(), true)
  is(subscript('(a)(null)')({ a: v => v }), null)
  is(subscript('false&true')({}), 0)
  is(subscript('(false)||((null))')({}), null)
  is(subscript('undefined')({}), undefined)
  is(subscript('(undefined)')({}), undefined)
  is(subscript('true||((false))')({}), true)
  is(subscript('a(true)')({ a: v => v }), true)
  is(subscript('a0')({ a0: 1 }), 1)
  is(subscript('x(0)')({ x: v => !!v }), false)
  is(subscript('x(true)')({ x: v => !!v }), true)

  is(subscript('f')({ f: 1 }), 1)
  is(subscript('f(false)')({ f: v => !!v }), false)
})

test.skip('bad number', t => {
  is(subscript('-1.23e-2')(), -1.23e-2)
  throws(x => subscript('.e-1')())
})

test('intersecting binary', async t => {
  sameAsJs('a | b', { a: 1234, b: 4567 })
  sameAsJs('a || b', { a: false, b: true })
  sameAsJs('a & b', { a: 1234, b: 4567 })
  sameAsJs('a && b', { a: true, b: true })

  sameAsJs('a >> b', { a: 1234, b: 2 })
})

test('signs', t => {
  sameAsJs('+-1', { a: 123 })
  sameAsJs('a(+1)', { a: v => v + 123 })
  sameAsJs('a[+1]', { a: [, 123] })
  sameAsJs('a+(1)', { a: 123 })
  sameAsJs('a+!1', { a: 123 })
  sameAsJs('a+-1', { a: 123 })
  sameAsJs('1+-1.23e-2-1.12', { a: 123 })
  sameAsJs('-+(1)', { a: 123 })
  sameAsJs('+1.12-+-a+-(+1)', { a: 123 })
  sameAsJs('+1.12-+-a[+1]', { a: [, 123] })
  sameAsJs('+1-+-1', { a: 123 })
  sameAsJs('-a[1]', { a: [, 123] })
  sameAsJs('-a.b[1](2)', { a: { b: [, v => v + 123] } })
  sameAsJs('+1-+-a[1]', { a: [, 123] })
  sameAsJs('+1 + +2', { a: 123 })
  sameAsJs('+1 + -2', { a: 123 })
  sameAsJs('+1 -+2', { a: 123 })
  sameAsJs('1 -2', { a: 123 })
  sameAsJs('+1 -2', { a: 123 })
  sameAsJs('-1 +2', { a: 123 })
})

test('unaries: seqs', t => {
  sameAsJs('-2')
  sameAsJs('+-2')
  sameAsJs('-+-2')
  sameAsJs('-+!2')
  sameAsJs('1-+-2')
  sameAsJs('1-+!2')
  sameAsJs('1 * -1')
})

test('unaries: inc/dec', t => {
  let ctx = { a: 2, b: { c: 1 }, d: ['c'] }
  is(subscript('--a')(ctx), 1)
  is(ctx.a, 1)
  is(subscript('++ a')(ctx), 2)
  is(ctx.a, 2)

  is(subscript('++ b.c')(ctx), 2)
  is(ctx.b.c, 2)

  is(subscript('++ b["c"]')(ctx), 3)
  is(ctx.b.c, 3)

  is(subscript('b["c"]++')(ctx), 3)
  is(ctx.b.c, 4)

  is(subscript('b[d[0]]++')(ctx), 4)
  is(ctx.b.c, 5)

  is(subscript('a++, b.c++')(ctx), 5)
  is(ctx.a, 3)
  is(ctx.b.c, 6)
})

test('unaries: postfix', t => {
  let ctx = { a: 2 }
  is(subscript('a--')(ctx), 2)
  is(ctx.a, 1)
  is(subscript('a++')(ctx), 1)
  is(ctx.a, 2)
  is(subscript('a ++')(ctx), 2)
  is(subscript('a  --')(ctx), 3)
})

test('prop access', t => {
  sameAsJs('a["b"]["c"][0]', { a: { b: { c: [1] } } })
  is(subscript('a.b.c')({ a: { b: { c: [1] } } }), [1])
  is(subscript('a.b.c.0')({ a: { b: { c: [1] } } }), 1)
})

test('parens', t => {
  sameAsJs('1+(b)()', { b: v => 1 })
  sameAsJs('(1)+-b()', { b: v => 1 })
  sameAsJs('1+a(b)', { b: 1, a: v => v + 1 })
  sameAsJs('1+(b)', { b: 1 })
  sameAsJs('1+-(b)', { b: 1 })
  sameAsJs('(b)', { b: 1 })
  sameAsJs('+b', { b: 1 })
  sameAsJs('+(b)', { b: 1 })
  sameAsJs('+((b))', { b: 1 })
  is(subscript('++(b)')({ b: 1 }), 2)
  is(subscript('!a(b)')({ a: v => v, b: false }), true)
  sameAsJs('+(b)', { b: 1 })
  sameAsJs('1+(b)', { b: 1 })
  sameAsJs('1+((b))', { b: 1 })
  sameAsJs('(1)+-b', { b: 1 })
  sameAsJs('x[1]+-b', { b: 1, x: [, 2] })
  sameAsJs('x[+-1]', { b: 1, x: [, 2] })
  sameAsJs('(+-1)', { b: 1 })
  sameAsJs('x(+-1)', { b: 1, x: v => v + 1 })
  sameAsJs('(1,2,3)', { b: 1 })
})

test('functions', t => {
  sameAsJs('a()', { a: v => 123 })
  sameAsJs('a(1)', { a: (v) => v })
  sameAsJs('a(1,2)', { a: (v, w) => v + w })
  sameAsJs('(c,d)', { a: v => ++v, c: 1, d: 2 })
  sameAsJs('a(b)(d)', { a: v => w => v + w, b: 1, d: 2 })
  sameAsJs('a(b,c)(d)', { a: (v, w) => z => z + v + w, b: 1, c: 2, d: 3 })
  sameAsJs('(c)(e)', { c: v => ++v, e: 1 })
  sameAsJs('b(c,d)', { b: (v, w) => v + w, c: 1, d: 2 })
  sameAsJs('b(c)(e)', { b: v => w => v + w, c: 1, e: 2 })
  sameAsJs('(c,d)(e)', { d: v => ++v, c: 1, e: 1 })
  sameAsJs('a.b(c,d)', { a: { b: (v, w) => w + v }, c: 1, d: 2 })
  sameAsJs('a.b(c.d)', { a: { b: (v) => ++v }, c: { d: 2 } })
})

test('chains', t => {
  sameAsJs('a["b"]["c"]["d"]', { a: { b: { c: { d: 1 } } } })
  sameAsJs('a.b.c.d', { a: { b: { c: { d: 1 } } } })
  sameAsJs('a.f', { a: { f: 1 } })
  sameAsJs('a.b[c.d].e.f', { a: { b: { d: { e: { f: 1 } } } }, c: { d: 'd' } })
  sameAsJs('a.b(1)(2).c', { a: { b: v => w => ({ c: v + w }) } })
  sameAsJs('a.b(1)(2)', { a: { b: v => w => v + w } })
  sameAsJs('a()()()', { a: () => () => () => 2 })
  sameAsJs('a( )( )( )', { a: () => () => () => 2 })
  sameAsJs('a.b()()', { a: { b: () => () => 2 } })
  sameAsJs('(a)()()', { a: () => () => 2 })
  sameAsJs('a.b(c.d).e.f', { a: { b: v => ({ e: { f: v } }) }, c: { d: 123 } })
  sameAsJs('(c.d).e', { c: { d: { e: 1 } } })
  sameAsJs('a.b(c.d).e(f).g()', { a: { b: v => ({ e: w => ({ g: () => v + w }) }) }, c: { d: 123 }, f: 456 })
  sameAsJs('a.b[c.d].e', { a: { b: [, { e: 1 }] }, c: { d: 1 } })
  sameAsJs('a.b[c.d].e(g.h)', { a: { b: [, { e: v => v }] }, c: { d: 1 }, g: { h: 2 } })
  sameAsJs('a(b)(c)', { a: v => w => v + w, b: 1, c: 2 })
  sameAsJs('a(1,2)(b)', { a: (v, w) => z => v + w + z, b: 1 })
  sameAsJs('(1,a)(b)', { a: v => v, b: 1 })
  sameAsJs('+(1,a)(b)', { a: v => v, b: 1 })
  sameAsJs('a[b][c]', { a: { b: { c: 1 } }, b: 'b', c: 'c' })
  sameAsJs('a[1](b)["c"]', { a: [, v => ({ c: v })], b: 1 })
  sameAsJs('a(1)[b]("c")', { a: v => ({ b: w => v + w }), b: 'b' })
  sameAsJs('a[1][b]["c"]', { a: [, { b: { c: 1 } }], b: 'b', c: 'c' })
  sameAsJs('a(1)(b)("c")', { a: v => w => z => v + w + z, b: 'b' })
})

test.skip('ext: in operator', async t => {
  await import('../feature/in.js')

  sameAsJs('inc in bin', { bin: { inc: 1 }, inc: 'inc' })
  sameAsJs('bin in inc', { inc: { bin: 1 }, bin: 'bin' })
  sameAsJs('bin in(inc)', { bin: 'bin', inc: { bin: 1 } })
  throws(() => subscript('b inc'))
})

test('array', async t => {
  await import('../feature/collection.js')
  // spread is now in consolidated op.js

  is(subscript('[]')(), [])
  is(subscript('[ 1 ]')(), [1])
  is(subscript('[ 1, 2+3, "4" ]')(), [1, 5, '4'])

  is(subscript('[1,2,3,4,5,6]')(), [1, 2, 3, 4, 5, 6])
  is(subscript('[1,2,3,4,5]')(), [1, 2, 3, 4, 5])
  is(subscript('[1,2,3,4]')(), [1, 2, 3, 4])
  is(subscript('[1,2,3]')(), [1, 2, 3])
  is(subscript('[1]')(), [1])
  is(subscript('[1]+[2]')(), '12')

  is(subscript('[]')(), [])
  is(subscript('[ ]')(), [])

  is(subscript('[ 1, ...x ]')({ x: [2, 3] }), [1, 2, 3])

  sameAsJs('[1]')
  sameAsJs('[1,2,3]')
  sameAsJs('[0]', {})
  sameAsJs('[""]', {})
  sameAsJs('[true]', {})
  sameAsJs('[false]', {})
  sameAsJs('[null]', {})
  sameAsJs('[undefined]', {})
})

test('ternary', async t => {
  // Ternary already included via c/op.js through jessie preset

  sameAsJs('a?b:c', { a: true, b: 1, c: 2 })
  sameAsJs('a?b:c', { a: false, b: 1, c: 2 })

  sameAsJs('a ? b ? c : d : e', { a: 0, b: 0, c: 2, d: 3, e: 4 })
  sameAsJs('a ? b ? c : d : e', { a: 1, b: 0, c: 2, d: 3, e: 4 })
  sameAsJs('a ? b ? c : d : e', { a: 1, b: 1, c: 2, d: 3, e: 4 })

  sameAsJs('a ? b : c ? d : e', { a: 0, b: 0, c: 2, d: 3, e: 4 })
  sameAsJs('a ? b : c ? d : e', { a: 1, b: 0, c: 2, d: 3, e: 4 })
  sameAsJs('a ? b : c ? d : e', { a: 1, b: 1, c: 2, d: 3, e: 4 })

  sameAsJs('a?b:c?d:e?f:g', { a: 0, c: 0, d: 2, e: 0, f: 3, g: 4 })

  sameAsJs('a((1 + 2), (e > 0 ? f : g))', { a: (x, y) => x + y, e: 1, f: 2, g: 3 })
})

test('object', async t => {
  // collection.js and ternary already included via jessie preset

  sameAsJs('{}', {})
  sameAsJs('{x: 1}', {})
  sameAsJs('{x: 1, "y":2}', {})
  sameAsJs('{x: 1+2, y:a(3)}', { a: v => v + 1 })
  sameAsJs('{x: 1+2, y:a(3)}', { a: x => x * 2 })
  sameAsJs('{1: 2}')
  sameAsJs('{x}', { x: 1 })
  sameAsJs('{x, y}', { x: 1, y: 2 })
  sameAsJs('{...x}', { x: { a: 1 } })

  sameAsJs('{a:b?c:d}', { b: 2, c: 3, d: 4 })
  sameAsJs('{a:b?c:d, e:!f?g:h}', { b: 2, c: 3, d: 4, f: 1, g: 2, h: 3 })
  sameAsJs('{a:b?c:d, e:f=g?h:k}', { b: 2, c: 3, d: 4, f: null, g: 0, h: 1, k: 2 })

  sameAsJs('b?{c:1}:{d:2}', { b: 2 })

  sameAsJs('{b:1, c:d}', { d: true })
})

test('ext: arrow', async t => {
  // arrow is now in consolidated op.js

  is(subscript('() => 1')()(), 1)
  is(subscript('(a) => a+1')()(1), 2)
  is(subscript('(a) => a+b')({ b: 2 })(1), 3)
  is(subscript('a=>a+=1')()(1), 2)
  is(parse('a=>a,b=>b=c=d'), [',', ['=>', 'a', 'a'], ['=>', 'b', ['=', 'b', ['=', 'c', 'd']]]])
  is(parse('a=>b=>c=d'), ['=>', 'a', ['=>', 'b', ['=', 'c', 'd']]])
})

test('ext: justin', async t => {
  await import('../parse/justin.js')
  sameAsJs(`"abcd" + 'efgh'`)
  is(subscript('a;b')({ a: 1, b: 2 }), 2)

  sameAsJs('{x:~1, "y":2**2}["x"]', {})
  sameAsJs('{x:~1, "y":2**2}["x"]', {})
  sameAsJs('{x:~1, "y":2**2}["y"]', {})
  sameAsJs('e > 0 ? f : g', { e: 1, f: 2, g: 3 }, 2)
  sameAsJs('a((1 + 2), (e > 0 ? f : g))', { a: (v, w) => v + w, e: 1, f: 2, g: 3 })

  sameAsJs('{x: 1+2, y:a(3)}', { a: x => x * 2 })
  sameAsJs('{a:b?c:d, e:!f?g:h}', { b: 2, c: 3, d: 4, f: 1, g: 2, h: 3 })
  sameAsJs('b?{c:1}:{d:2}', { b: 2 })

  // keep context
  console.log('---a?.()')
  sameAsJs('a?.()', { a: v => 1 })
  console.log('---a?.valueOf()')
  sameAsJs('a?.valueOf()', { a: true })
  console.log('---a?.b?.valueOf?.()')
  sameAsJs('a?.b?.valueOf?.()', { a: { b: true } })
  console.log('---a?.valueOf?.()')
  sameAsJs('a?.valueOf?.()', { a: true })
  console.log('---a?.["valueOf"]()')
  sameAsJs('a?.["valueOf"]()', { a: true })
  console.log('---a?.["valueOf"]?.()')
  sameAsJs('a?.["valueOf"]?.()', { a: true })

  // assigns
  let s = { a: 0 }
  subscript('a = {b:0}')(s)
  is(s, { a: { b: 0 } })
  subscript('a.b ||= 1')(s)
  is(s, { a: { b: 1 } })
})

test('assignment', async t => {
  const fn = subscript('a = b * 2')
  let state = { b: 1 }
  fn(state)
  is(state, { a: 2, b: 1 })

  const fn2 = subscript('localvar = 0')
  let state2 = {}
  fn2(state2)
  is(state2, { localvar: 0 })

  const fn3 = subscript('x.y = 0')
  let state3 = { x: { y: 1 } }
  fn3(state3)
  is(state3, { x: { y: 0 } })

  const fn4 = subscript('123, y=0')
  let state4 = { x: { y: 1 } }
  fn4(state4)
  is(state4, { x: { y: 1 }, y: 0 })

  const fn5 = subscript('y = 1; x.y;')
  let state5 = { x: { y: 1 } }
  fn5(state5)
  is(state5, { x: { y: 1 }, y: 1 })

  const fn6 = subscript('x.y += 1; z -= 2; w *= 2;')
  let state6 = { x: { y: 1 }, z: 1, w: 2 }
  fn6(state6)
  is(state6, { x: { y: 2 }, z: -1, w: 4 })
})

test('comments', async t => {
  // Comments already included via c/comment.js through jessie preset
  is(subscript('/* x */1/* y */+/* z */2')({}), 3)
  is(subscript(`a /
    // abc
    b`)({ a: 1, b: 2 }), 1 / 2)
  is(subscript(`"a" + "b" // concat`)(), 'ab')
  is(subscript('/* */1/* */+/* */2')({}), 3)
  is(subscript('')({}), undefined)
  is(subscript('//\nx')({ x: 1 }), 1)
  is(subscript('x//\n')({ x: 1 }), 1)
  is(subscript('x/**/')({ x: 1 }), 1)
  is(subscript('/**/x')({ x: 1 }), 1)
  is(subscript('/* */')({}), undefined)
  is(subscript('//')({}), undefined)

  is(parse(`a;
  //b
  b;c`), [';', 'a', 'b', 'c'])
})

test('unfinished sequences', async t => {
  throws(() => subscript('a+b)+c'))
  throws(() => subscript('(a+(b)))+c'))
  throws(() => subscript('a+b+)c'))
})

test('err: unknown operators', t => {
  throws(() => subscript('a <<< b'))
  throws(() => subscript('a >== b'))
  throws(() => subscript('a -> b'))
  throws(() => subscript('a ->'))
  throws(() => subscript('-> a'))
  throws(() => subscript('a !'))
  throws(() => subscript('b @'))
})

test('err: missing arguments', t => {
  throws(() => console.log(subscript('a[]')))
  throws(() => console.log(subscript('a[  ]')))
  throws(() => console.log(subscript('()+1')))
  throws(() => console.log(subscript('(  )+1')))
  throws(() => console.log(subscript('a+')))
  throws(() => console.log(subscript('(a / )')))
})

test('err: unclosed parens', t => {
  throws(() => subscript('a[  '))
  throws(() => subscript('(  +1'))
  throws(() => subscript('(a / '))
  throws(() => subscript('( '))
  throws(() => subscript('a )'))
  throws(() => subscript(')'))
  throws(() => subscript('+)'))
})

test('err: wrong sequences', t => {
  throws(() => subscript('a b'))
  throws(() => subscript('a 1'))
  throws(() => subscript('a "a"'))
  throws(() => subscript('"a" a'))
  throws(() => subscript('"a" "b"'))
  throws(() => subscript('"a" 1'))
  throws(() => subscript('1 "a"'))
  throws(() => subscript('true false'))
  throws(() => subscript('null null'))
})

test('low-precedence unary', t => {
  const ampCode = '&'.charCodeAt(0)
  const origLookup = lookup[ampCode]
  const origOp = operators['&']

  unary('&', MULT - 0.5), operator('&', (a) => (a = compile(a), ctx => ~a(ctx)))
  is(subscript('&a+b*c')({ a: 1, b: 2, c: 3 }), 4)
  is(subscript('&a*b+c')({ a: 1, b: 2, c: 3 }), 0)

  lookup[ampCode] = origLookup
  operators['&'] = origOp
})

test('stdlib cases', t => {
  is(subscript('pow(a, 3)')({ pow: Math.pow, a: 1 }), 1)
  is(subscript('Math.pow(a, 3)')({ Math, a: 1 }), 1)
  is(subscript('Math.pow(a, 3) / 2 + b * 2 - 1')({ Math, a: 1, b: 1 }), 1.5)
})

test.skip('ext: collect args', async t => {
  let args = [], id = parse.id
  parse.id = (a, b) => (a = id(), a && args.push(a), a)

  let fn = subscript('Math.pow(), a.b(), c + d() - e, f[g], h in e, true, {x: "y", "z": w}, i ? j : k')
  same(args,
    ['Math', 'pow', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'e', 'x', 'w', 'i', 'j', 'k']
  )
})
