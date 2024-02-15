import test, { is, throws, same } from 'tst'
import parse, { skip, expr, err, cur, idx } from '../src/parse.js'
import subscript, { set, binary, operator, compile, token } from '../subscript.js'
import { PREC_MULT } from '../src/const.js'

const evalTest = (str, ctx = {}) => {
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
  evalTest('0 + 1 + 2.0')
  evalTest('0 + (1 + 2)')
  evalTest('-2 - 2')
  evalTest('0 + 1 - 2')
  evalTest('0 - 1 + 2')
  evalTest('0 + 1 + 2 - 1 - 2 + 1')
  evalTest('0 * 1 * 2 / 1 / 2 * 1')
  evalTest('0 + 1 - 2 * 3')
  evalTest('1 * 2 - 3')
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

  evalTest('a.b', { a: { b: 2 } })
  evalTest('1 + a.b + 3.5', { a: { b: 3 } })
  evalTest('1 + (a.b + 3.5)', { a: { b: 4 } })
  evalTest(`a (  ccc. d,  -+1.0 )`, { a: (b, c) => b + c, ccc: { d: 1 } })
  evalTest(`a.b (  ccc. d , -+1.0 ) . e`, { a: { b: (c, d) => ({ e: c + d }) }, ccc: { d: 10 } })
  evalTest(`a * 3 / 2`, { a: 42 })
  evalTest(`(a + 2) * 3 / 2 + b * 2 - 1`, { a: 12, b: 13 })
  evalTest('a()()()', { a: b => c => d => 2 })
  evalTest('a(b)(c)', { a: x => y => x + y, b: 2, c: 3 })

  evalTest(`"abcd" + "efgh"`)

  evalTest('x(a + 3)', { x: v => v + 1, a: 3 })
  evalTest('1 + x(a.b + 3.5)', { x: v => v + 1, a: { b: 1 } })
  evalTest('a[b]', { a: { x: 1 }, b: 'x' })
  evalTest('(a(b) + 3.5)', { a: v => v * 2, b: 3 })
  evalTest('1 + x(a[b] + 3.5)', { x: v => v + 1, a: { y: 1 }, b: 'y' })
  is(subscript('x.y.z,123')({ x: { y: { z: 345 } } }), 123)
  evalTest('x.y.z(123)', { x: { y: { z: x => x } } })
  evalTest('x.y.z(123 + c[456]) + n', { x: { y: { z: v => v + 1 } }, c: { 456: 789 }, n: 1 })
  evalTest('1 || 1')
  evalTest('-1%2')
  evalTest('-(1%2)')
  evalTest('+1 * (a.b - 3.5) - "asdf" || x.y.z(123 + c[456]) + n', { a: { b: 1 }, x: { y: { z: v => v } }, c: { 456: 789 }, n: 1 })
})

test('right-assoc', t => {
  // **
  set('**', -14, (a, b) => a ** b, true)

  evalTest('1 + 2 * 3 ** 4 + 5', {})
  evalTest(`a + b * c ** d | e`, { a: 1, b: 2, c: 3, d: 4, e: 5 })
})

test('syntactic', t => {
  is(parse(''), '')
  is(subscript('')(), undefined)
  is(subscript(' ')(), undefined)
  is(subscript('\n\r')(), undefined)
})

test('readme', t => {
  evalTest(`a.b + c(d-1)`, { a: { b: 1 }, c: x => x * 2, d: 3 })
  evalTest(`min * 60 + "sec"`, { min: 5 })

  set('|', 6, (a, b) => a?.pipe?.(b) || (a | b)) // overload pipe operator
  token('=>', 2, (args, body) => (body = expr(), ctx => (...args) => body())) // single-arg arrow function parser

  let evaluate = subscript(`
    interval(350)
    | take(25)`
    // | map(gaussian)
    // | map(num => "•".repeat(Math.floor(num * 65)))
  )
  evaluate({
    Math,
    // map,
    // gaussian
    take: arg => ({ pipe: b => console.log('take', b) }),
    interval: arg => ({ pipe: b => console.log('interval to', b) }),
  })


  // add ~ unary operator with precedence 15
  set('~', 15, a => ~a)

  // add === binary operator
  set('===', 9, (a, b) => a === b)

  // add literals
  // set('true',20, [,a => ()=>true])
  // set('false',20, [,a => ()=>false])
  token('true', 20, a => ['', true])
  token('false', 20, a => ['', false])

  is(subscript('true === false')(), false) // false
})


test('ext: interpolate string', t => {
  is(subscript('a+1')({ a: 1 }), 2)
})

test('strings', t => {
  is(subscript('"a"')(), 'a')
  throws(x => subscript('"a'))
  throws(x => subscript('"a" + "b'))
  is(subscript('"a" + ("1" + "2")')(), "a12")

  // parse.quote['<?']='?>'
  // is(parse('"abc" + <?js\nxyz?>'), ['+','"abc','<?js\nxyz?>'])

  // parse.quote['<--']='-->'
  // is(parse('"abc" + <--js\nxyz-->'), ['+','"abc','<--js\nxyz-->'])
})
test('ext: literals', t => {
  token('null', 20, a => a ? err() : ['', null])
  token('true', 20, a => a ? err() : ['', true])
  token('false', 20, a => a ? err() : ['', false])
  token('undefined', 20, a => a ? err() : ['', undefined])

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

  // is(subscript('null++')(), ['++',null])
  // is(subscript('false++'), ['++',false])
  // is(subscript('++false'), ['++',false])
})

test.skip('bad number', t => {
  is(subscript('-1.23e-2')(), -1.23e-2)
  // NOTE: it's not criminal to create NaN instead of this construct
  throws(x => subscript('.e-1')())
})

test('intersecting binary', t => {
  evalTest('a | b', { a: 1234, b: 4567 })
  evalTest('a || b', { a: false, b: true })
  evalTest('a & b', { a: 1234, b: 4567 })
  evalTest('a && b', { a: true, b: true })

  evalTest('a >> b', { a: 1234, b: 2 })
  evalTest('a >>> b', { a: 1234, b: 2 })
})
test('signs', t => {
  evalTest('+-1', { a: 123 })
  evalTest('a(+1)', { a: v => v + 123 })
  evalTest('a[+1]', { a: [, 123] })
  evalTest('a+(1)', { a: 123 })
  evalTest('a+!1', { a: 123 })
  evalTest('a+-1', { a: 123 })
  evalTest('1+-1.23e-2-1.12', { a: 123 })
  evalTest('-+(1)', { a: 123 })
  evalTest('+1.12-+-a+-(+1)', { a: 123 })
  evalTest('+1.12-+-a[+1]', { a: [, 123] })
  evalTest('+1-+-1', { a: 123 })
  evalTest('-a[1]', { a: [, 123] })
  evalTest('-a.b[1](2)', { a: { b: [, v => v + 123] } })
  evalTest('+1-+-a[1]', { a: [, 123] })
  evalTest('+1 + +2', { a: 123 })
  evalTest('+1 + -2', { a: 123 })
  evalTest('+1 -+2', { a: 123 })
  evalTest('1 -2', { a: 123 })
  evalTest('+1 -2', { a: 123 })
  evalTest('-1 +2', { a: 123 })
})
test('unaries: seqs', t => {
  evalTest('-2')
  evalTest('+-2')
  evalTest('-+-2')
  evalTest('-+!2')
  evalTest('1-+-2')
  evalTest('1-+!2')
  evalTest('1 * -1')
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
  // evalTest('a++(b)',{})
})

test('prop access', t => {
  evalTest('a["b"]["c"][0]', { a: { b: { c: [1] } } })
  is(subscript('a.b.c')({ a: { b: { c: [1] } } }), [1])
  // NOTE: invalid JS
  is(subscript('a.b.c.0')({ a: { b: { c: [1] } } }), 1)
})

test('parens', t => {
  evalTest('1+(b)()', { b: v => 1 })
  evalTest('(1)+-b()', { b: v => 1 })
  evalTest('1+a(b)', { b: 1, a: v => v + 1 })
  evalTest('1+(b)', { b: 1 })
  evalTest('1+-(b)', { b: 1 })
  evalTest('(b)', { b: 1 })
  evalTest('+b', { b: 1 })
  evalTest('+(b)', { b: 1 })
  evalTest('+((b))', { b: 1 })
  is(subscript('++(b)')({ b: 1 }), 2)
  // NOTE: invalid in JS
  // is(subscript('++a(b)')({b:1, a:v=>v+1}),3)
  is(subscript('!a(b)')({ a: v => v, b: false }), true)
  evalTest('+(b)', { b: 1 })
  evalTest('1+(b)', { b: 1 })
  evalTest('1+((b))', { b: 1 })
  evalTest('(1)+-b', { b: 1 })
  evalTest('x[1]+-b', { b: 1, x: [, 2] })
  evalTest('x[+-1]', { b: 1, x: [, 2] })
  evalTest('(+-1)', { b: 1 })
  evalTest('x(+-1)', { b: 1, x: v => v + 1 })
  evalTest('(1,2,3)', { b: 1 })
})

test('functions', t => {
  evalTest('a()', { a: v => 123 })
  evalTest('a(1)', { a: (v) => v })
  evalTest('a(1,2)', { a: (v, w) => v + w })
  evalTest('(c,d)', { a: v => ++v, c: 1, d: 2 })
  evalTest('a(b)(d)', { a: v => w => v + w, b: 1, d: 2 })
  evalTest('a(b,c)(d)', { a: (v, w) => z => z + v + w, b: 1, c: 2, d: 3 })
  evalTest('(c)(e)', { c: v => ++v, e: 1 })
  evalTest('b(c,d)', { b: (v, w) => v + w, c: 1, d: 2 })
  evalTest('b(c)(e)', { b: v => w => v + w, c: 1, e: 2 })
  evalTest('(c,d)(e)', { d: v => ++v, c: 1, e: 1 })
  evalTest('a.b(c,d)', { a: { b: (v, w) => w + v }, c: 1, d: 2 })
  evalTest('a.b(c.d)', { a: { b: (v) => ++v }, c: { d: 2 } })
})

test('chains', t => {
  evalTest('a["b"]["c"]["d"]', { a: { b: { c: { d: 1 } } } })
  evalTest('a.b.c.d', { a: { b: { c: { d: 1 } } } })
  evalTest('a.f', { a: { f: 1 } })
  evalTest('a.b[c.d].e.f', { a: { b: { d: { e: { f: 1 } } } }, c: { d: 'd' } })
  evalTest('a.b(1)(2).c', { a: { b: v => w => ({ c: v + w }) } })
  evalTest('a.b(1)(2)', { a: { b: v => w => v + w } })
  evalTest('a()()()', { a: () => () => () => 2 })
  evalTest('a( )( )( )', { a: () => () => () => 2 })
  evalTest('a.b()()', { a: { b: () => () => 2 } })
  evalTest('(a)()()', { a: () => () => 2 })
  evalTest('a.b(c.d).e.f', { a: { b: v => ({ e: { f: v } }) }, c: { d: 123 } })
  evalTest('(c.d).e', { c: { d: { e: 1 } } })
  evalTest('a.b(c.d).e(f).g()', { a: { b: v => ({ e: w => ({ g: () => v + w }) }) }, c: { d: 123 }, f: 456 })
  evalTest('a.b[c.d].e', { a: { b: [, { e: 1 }] }, c: { d: 1 } })
  evalTest('a.b[c.d].e(g.h)', { a: { b: [, { e: v => v }] }, c: { d: 1 }, g: { h: 2 } })
  evalTest('a(b)(c)', { a: v => w => v + w, b: 1, c: 2 })
  evalTest('a(1,2)(b)', { a: (v, w) => z => v + w + z, b: 1 })
  evalTest('(1,a)(b)', { a: v => v, b: 1 })
  evalTest('+(1,a)(b)', { a: v => v, b: 1 })
  evalTest('a[b][c]', { a: { b: { c: 1 } }, b: 'b', c: 'c' })
  evalTest('a[1](b)["c"]', { a: [, v => ({ c: v })], b: 1 })
  evalTest('a(1)[b]("c")', { a: v => ({ b: w => v + w }), b: 'b' })
  evalTest('a[1][b]["c"]', { a: [, { b: { c: 1 } }], b: 'b', c: 'c' })
  evalTest('a(1)(b)("c")', { a: v => w => z => v + w + z, b: 'b' })
})

test('ext: in operator', t => {
  set('in', 10, (a, b) => a in b)

  evalTest('inc in bin', { bin: { inc: 1 }, inc: 'inc' })
  evalTest('bin in inc', { inc: { bin: 1 }, bin: 'bin' })
  evalTest('bin in(inc)', { bin: 'bin', inc: { bin: 1 } })
  throws(() => subscript('b inc'))
})

test('ext: list', t => {
  token('[', 20, a => !a && ['[', expr(0, 93) || ''])
  operator('[', (a, b) => !b && (
    !a ? ctx => [] : // []
      a[0] === ',' ? (a = a.slice(1).map(compile), ctx => a.map(a => a(ctx))) : // [a,b,c]
        (a = compile(a), ctx => [a(ctx)]) // [a]
  )
  )

  is(subscript('[1,2,3,4,5,6]')(), [1, 2, 3, 4, 5, 6])
  is(subscript('[1,2,3,4,5]')(), [1, 2, 3, 4, 5])
  is(subscript('[1,2,3,4]')(), [1, 2, 3, 4])
  is(subscript('[1,2,3]')(), [1, 2, 3])
  is(subscript('[1]')(), [1])
  is(subscript('[1]+[2]')(), '12')

  is(subscript('[]')(), [])
  is(subscript('[ ]')(), [])

  // TODO: prefix/postfix maybe?
  // is(subscript('[1,]')({}),[1])
  // is(subscript('[,]')({}),[undefined])
  // is(subscript('[1,,2,"b"]')({b:3}),[1,undefined,2,'b'])
  // is(subscript('[,,2,"b"]')({b:3}),[undefined,undefined,2,'b'])
  // is(subscript('[1,,2,b]')({b:3}),[1,undefined,2,3])

  evalTest('[1]')
  evalTest('[1,2,3]')
  evalTest('[0]', {})
  evalTest('[""]', {})
  evalTest('[true]', {})
  evalTest('[false]', {})
  evalTest('[null]', {})
  evalTest('[undefined]', {})
})

test.skip('ext: ternary', t => {
  // NOTE: must be tested separately, else breaks jsep test
  token('?', 3,
    (a, b, c) => a && (b = expr(2, 58)) && (c = expr(3), ['?', a, b, c]))
  operator('?',
    (a, b, c) => (a = compile(a), b = compile(b), c = compile(c), ctx => a(ctx) ? b(ctx) : c(ctx))
  )

  evalTest('a?b:c', { a: true, b: 1, c: 2 })
  evalTest('a?b:c', { a: false, b: 1, c: 2 })
  evalTest('a((1 + 2), (e > 0 ? f : g))', { a: (x, y) => x + y, e: 1, f: 2, g: 3 })

  evalTest('a?b:c?d:e', { a: 0, c: 1, d: 2 })
  evalTest('a?b:c?d:e', { a: 0, c: 0, d: 2, e: 3 })
  evalTest('a?b:c?d:e?f:g', { a: 0, c: 0, d: 2, e: 0, f: 3, g: 4 })
  evalTest('a? b?c:d :e', { a: 0, c: 0, d: 1, e: 2 })
})

test('ext: object', t => {
  token('{', 20, a => !a && (['{', expr(0, 125) || '']))
  operator('{', (a, b) => (
    !a ? ctx => ({}) : // {}
      a[0] === ',' ? (a = a.slice(1).map(compile), ctx => Object.fromEntries(a.map(a => a(ctx)))) : // {a:1,b:2}
        a[0] === ':' ? (a = compile(a), ctx => Object.fromEntries([a(ctx)])) : // {a:1}
          (b = compile(a), ctx => ({ [a]: b(ctx) }))
  ))
  token(':', 1.1, (a, b) => (b = expr(1.1) || err(), [':', a, b]))
  operator(':', (a, b) => (b = compile(b), a = Array.isArray(a) ? compile(a) : (a => a).bind(0, a), ctx => [a(ctx), b(ctx)]))
  // set('=', 2, (a, b) => b)

  evalTest('{}', {})
  evalTest('{x: 1}', {})
  evalTest('{x: 1, "y":2}', {})
  evalTest('{x: 1+2, y:a(3)}', { a: v => v + 1 })
  evalTest('{x: 1+2, y:a(3)}', { a: x => x * 2 })
  evalTest('{1: 2}')
  evalTest('{x}', { x: 1 })

  evalTest('{a:b?c:d}', { b: 2, c: 3, d: 4 })
  evalTest('{a:b?c:d, e:!f?g:h}', { b: 2, c: 3, d: 4, f: 1, g: 2, h: 3 })
  evalTest('{a:b?c:d, e:f=g?h:k}', { b: 2, c: 3, d: 4, f: null, g: 0, h: 1, k: 2 })

  evalTest('b?{c:1}:{d:2}', { b: 2 })

  evalTest('{b:true, c:d}', { d: true })
})

test('ext: justin', async t => {
  await import('../justin.js')
  evalTest(`"abcd" + 'efgh'`)
  is(subscript('a;b')({ a: 1, b: 2 }), 2)
  evalTest('{x:~1, "y":2**2}["x"]', {})
  evalTest('{x:~1, "y":2**2}["x"]', {})
  evalTest('{x:~1, "y":2**2}["y"]', {})
  evalTest('e > 0 ? f : g', { e: 1, f: 2, g: 3 }, 2)
  evalTest('a((1 + 2), (e > 0 ? f : g))', { a: (v, w) => v + w, e: 1, f: 2, g: 3 })

  evalTest('{x: 1+2, y:a(3)}', { a: x => x * 2 })
  evalTest('{a:b?c:d, e:!f?g:h}', { b: 2, c: 3, d: 4, f: 1, g: 2, h: 3 })
  evalTest('b?{c:1}:{d:2}', { b: 2 })

  // keep context
  console.log('---a?.()')
  evalTest('a?.()', { a: v => 1 })
  console.log('---a?.valueOf()')
  evalTest('a?.valueOf()', { a: true })
  console.log('---a?.b?.valueOf?.()')
  evalTest('a?.b?.valueOf?.()', { a: { b: true } })
  console.log('---a?.valueOf?.()')
  evalTest('a?.valueOf?.()', { a: true })
  // FIXME: these
  console.log('---a?.["valueOf"]()')
  evalTest('a?.["valueOf"]()', { a: true })
  console.log('---a?.["valueOf"]?.()')
  evalTest('a?.["valueOf"]?.()', { a: true })

  // assigns
  let s = { a: 0 }
  subscript('a = {b:0}')(s)
  is(s, { a: { b: 0 } })
  subscript('a.b = 1')(s)
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
})

test('ext: comments', t => {
  token('/*', 20, (a, prec) => (skip(c => c !== 42 && cur.charCodeAt(idx + 1) !== 47), skip(2), a || expr(prec) || ['']))
  token('//', 20, (a, prec) => (skip(c => c >= 32), a || expr(prec) || ['']))
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
})

test('unfinished sequences', async t => {
  throws(() => subscript('a+b)+c'))//, ['+','a','b'])
  throws(() => subscript('(a+(b)))+c'))//, ['+','a','b'])
  throws(() => subscript('a+b+)c'))//, ['+','a','b',null])
})

test('err: unknown operators', t => {
  throws(() => subscript('a <<< b'))
  throws(() => subscript('a >== b'))
  throws(() => subscript('a -> b'))
  throws(() => subscript('a ->'))
  throws(() => subscript('-> a'))
  throws(() => subscript('#a'))
  // throws(() => subscript('~a'))
  throws(() => subscript('a !'))
  throws(() => subscript('a#b'))
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
  set('&', PREC_MULT - 0.5, (a) => ~a)
  is(subscript('&a+b*c')({ a: 1, b: 2, c: 3 }), 4)
  is(subscript('&a*b+c')({ a: 1, b: 2, c: 3 }), 0)
})

test('stdlib cases', t => {
  is(subscript('pow(a, 3)')({ pow: Math.pow, a: 1 }), 1)
  is(subscript('Math.pow(a, 3)')({ Math, a: 1 }), 1)
  is(subscript('Math.pow(a, 3) / 2 + b * 2 - 1')({ Math, a: 1, b: 1 }), 1.5)
})

test('ext: collect args', async t => {
  const { lookup, default: script } = await import('../justin.js')

  let args = [], id = parse.id
  parse.id = (a, b) => (a = id(), a && args.push(a), a)

  // FIXME: maybe needs ignoring pow and b?
  let fn = subscript('Math.pow(), a.b(), c + d() - e, f[g], h in e, true, {x: "y", "z": w}, i ? j : k')
  same(args,
    ['Math', 'pow', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'e', 'x', 'w', 'i', 'j', 'k']
  )
})
