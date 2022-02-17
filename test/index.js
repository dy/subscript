import test, {is, throws, same} from 'tst'
import script, { binary } from '../subscript.js'
import parse, { skip, expr, token, err, cur, idx } from '../parse.js'
import { operator, compile } from '../evaluate.js'

const evalTest = (str, ctx={}) => {
  let ss=script(str), fn=new Function(...Object.keys(ctx), 'return ' + str)

  return is(ss(ctx), fn(...Object.values(ctx)))
}

test('basic', t => {
  is(script('1 + 2')(), 3)
  is(script('1 + 2 + 3')(), 6)
  is(script('1 + 2 * 3')(), 7)
  is(script('2 * 3 % 4')(), 2)
  is(script('2 % 3 * 4')(), 8)
  is(script('1 + 2 + 3 + 4')(), 10)
  is(script('1 * 2 + 3')(), 5)
  is(script('1 + 2 * 3 + 4')(), 11)
  is(script(`(1+2)`)(), 3)
  is(script(`1+(2+3)`)(), 6)
  is(script(`1+(2)`)(), 3)
  is(script(`1+(2)+3+((4))`)(), 10)
  is(script(`-2`)(), -2)
  evalTest('0 + 1 + 2.0')
  evalTest('0 + (1 + 2)')
  evalTest('-2 - 2')
  evalTest('0 + 1 - 2')
  evalTest('0 - 1 + 2')
  evalTest('0 + 1 + 2 - 1 - 2 + 1')
  evalTest('0 * 1 * 2 / 1 / 2 * 1')
  evalTest('0 + 1 - 2 * 3')
  evalTest('1 * 2 - 3')
  is(script(`a()`)({a:v=>1}), 1)
  is(script(`a( )`)({a:v=>1}), 1)
  is(script(`a(1)`)({a:v=>v}), 1)
  is(script(`a.b`)({a:{b:1}}), 1)
  is(script(`a . b`)({a:{b:1}}), 1)
  is(script('a.b.c')({a:{b:{c:1}}}), 1)
  is(script(`a(1).b`)({a:v=>({b:v})}), 1)
  is(script(`a ( c ) . e`)({ a:v=>({e:v}), c:1 }), 1)
  is(script('a[b][c]')({a:{b:{c:1}}, b:'b', c:'c'}), 1)
  is(script('a.b.c(d).e')({a:{b:{c:e=>({e})}}, d:1}), 1)
  is(script(`+-2`)(), -2)
  is(script(`+-a.b`)({a:{b:1}}), -1)
  is(script(`1+-2`)(), -1)
  is(script(`-a.b+1`)({a:{b:1}}), 0)
  is(script(`-a-b`)({a:1,b:2}), -3)
  is(script(`+-a.b+-!1`)({a:{b:1}}), -1)

  is(script(`a++ +1`)({a:1}), 2)

  is(script(`   .1   +   -1.0 -  2.3e+1 `)(), .1-1.0-2.3e+1)
  is(script(`( a,  b )`)({a:1,b:2}), 2)
  is(script(`a( b,  (c, d) )`)({ a:(b,c)=>b+c, b:2, c:3, d:4 }), 6)

  evalTest('a.b', {a:{b:2}})
  evalTest('1 + a.b + 3.5', {a:{b:3}})
  evalTest('1 + (a.b + 3.5)', {a:{b:4}})
  evalTest(`a (  ccc. d,  -+1.0 )`, {a:(b,c)=>b+c, ccc:{d:1}})
  evalTest(`a.b (  ccc. d , -+1.0 ) . e`, {a:{b:(c,d)=>({e:c+d}) }, ccc:{d:10}})
  evalTest(`a * 3 / 2`, {a:42})
  evalTest(`(a + 2) * 3 / 2 + b * 2 - 1`, {a:12, b:13})
  evalTest('a()()()', {a:b=>c=>d=>2})
  evalTest('a(b)(c)', {a:x=>y=>x+y, b:2, c:3})

  evalTest(`"abcd" + "efgh"`)

  evalTest('x(a + 3)',{x:v=>v+1,a:3})
  evalTest('1 + x(a.b + 3.5)', {x:v=>v+1, a:{b:1}})
  evalTest('a[b]', {a:{x:1}, b:'x'})
  evalTest('(a(b) + 3.5)', {a:v=>v*2, b:3})
  evalTest('1 + x(a[b] + 3.5)', {x:v=>v+1, a:{y:1}, b:'y'})
  is(script('x.y.z,123')({x:{y:{z:345}}}), 123)
  evalTest('x.y.z(123)', {x:{y:{z:x=>x}}})
  evalTest('x.y.z(123 + c[456]) + n', {x:{y:{z:v=>v+1}}, c:{456:789}, n:1})
  evalTest('1 || 1')
  evalTest('-1%2')
  evalTest('-(1%2)')
  evalTest('+1 * (a.b - 3.5) - "asdf" || x.y.z(123 + c[456]) + n', {a:{b:1}, x:{y:{z:v=>v}}, c:{456:789}, n:1})
})

test('right-assoc', t => {
  // **
  binary('**', 14, (a,b)=>a**b, true)

  evalTest('1 + 2 * 3 ** 4 + 5', {})
  evalTest(`a + b * c ** d | e`, {a:1,b:2,c:3,d:4,e:5})
})

test('syntactic', t => {
  is(script('')(), undefined)
  is(script(' ')(), undefined)
  is(script('\n\r')(), undefined)
})

test('readme', t => {
  evalTest(`a.b + c(d-1)`, {a:{b:1}, c:x=>x*2, d:3})
  evalTest(`min * 60 + "sec"`, {min: 5})

  operator('|', ( a, b ) => a?.pipe?.(b) || (a|b), 6 ) // overload pipe operator
  operator('=>', ( args, body ) => (body = expr(), ctx => (...args) => body() ) ) // single-arg arrow function parser

  let evaluate = script(`
    interval(350)
    | take(25)`
    // | map(gaussian)
    // | map(num => "•".repeat(Math.floor(num * 65)))
  )
  evaluate({
    Math,
    // map,
    // gaussian
    take: arg => ({pipe:b=>console.log('take', b)}),
    interval: arg => ({pipe:b=>console.log('interval to', b)}),
  })


  // add ~ unary operator with precedence 15
  operator('~', a => ~a, 15)

  // add === binary operator
  operator('===', (a, b) => a===b, 9)

  // add literals
  token('true', a => ()=>true)
  token('false', a => ()=>false)

  is(script('true === false')(), false) // false
})


test('ext: interpolate string', t => {
  is(script('a+1')({a:1}), 2)
})

test('strings', t => {
  is(script('"a"')(), 'a')
  throws(x => script('"a'))
  throws(x => script('"a" + "b'))
  is(script('"a" + ("1" + "2")')(), "a12")

  // parse.quote['<?']='?>'
  // is(parse('"abc" + <?js\nxyz?>'), ['+','"abc','<?js\nxyz?>'])

  // parse.quote['<--']='-->'
  // is(parse('"abc" + <--js\nxyz-->'), ['+','"abc','<--js\nxyz-->'])
})
test('ext: literals', t=> {
  token('null', a => a ? err() : ['',null])
  token('true', a => a ? err() : ['',true])
  token('false', a => a ? err() : ['',false])
  token('undefined', a => a ? err() : ['',undefined])

  is(script('null')({}), null)
  is(script('(null)')({}), null)
  is(script('!null')(), true)
  is(script('(a)(null)')({a:v=>v}), null)
  is(script('false&true')({}), 0)
  is(script('(false)||((null))')({}), null)
  is(script('undefined')({}), undefined)
  is(script('(undefined)')({}), undefined)
  is(script('true||((false))')({}), true)
  is(script('a(true)')({a:v=>v}), true)
  is(script('a0')({a0:1}), 1)
  is(script('x(0)')({x:v=>!!v}), false)
  is(script('x(true)')({x:v=>!!v}), true)

  is(script('f')({f:1}), 1)
  is(script('f(false)')({f:v=>!!v}), false)

  // is(script('null++')(), ['++',null])
  // is(script('false++'), ['++',false])
  // is(script('++false'), ['++',false])
})

test.skip('bad number', t => {
  is(script('-1.23e-2')(), -1.23e-2)
  // NOTE: it's not criminal to create NaN instead of this construct
  throws(x=>script('.e-1')())
})

test('intersecting binary', t => {
  evalTest('a | b', {a:1234, b:4567})
  evalTest('a || b', {a:false, b:true})
  evalTest('a & b', {a:1234, b:4567})
  evalTest('a && b', {a:true, b:true})

  evalTest('a >> b', {a:1234, b:2})
  evalTest('a >>> b', {a:1234, b:2})
})
test('signs', t => {
  evalTest('+-1', {a:123})
  evalTest('a(+1)', {a:v=>v+123})
  evalTest('a[+1]', {a:[,123]})
  evalTest('a+(1)', {a:123})
  evalTest('a+!1', {a:123})
  evalTest('a+-1', {a:123})
  evalTest('1+-1.23e-2-1.12', {a:123})
  evalTest('-+(1)', {a:123})
  evalTest('+1.12-+-a+-(+1)', {a:123})
  evalTest('+1.12-+-a[+1]', {a:[,123]})
  evalTest('+1-+-1', {a:123})
  evalTest('-a[1]', {a:[,123]})
  evalTest('-a.b[1](2)', {a:{b:[,v=>v+123]}})
  evalTest('+1-+-a[1]', {a:[,123]})
  evalTest('+1 + +2', {a:123})
  evalTest('+1 + -2', {a:123})
  evalTest('+1 -+2', {a:123})
  evalTest('1 -2', {a:123})
  evalTest('+1 -2', {a:123})
  evalTest('-1 +2', {a:123})
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
  let ctx = {a:2,b:{c:1},d:['c']}
  is(script('--a')(ctx),1)
  is(ctx.a,1)
  is(script('++ a')(ctx),2)
  is(ctx.a,2)

  is(script('++ b.c')(ctx),2)
  is(ctx.b.c,2)

  is(script('++ b["c"]')(ctx),3)
  is(ctx.b.c,3)

  is(script('b["c"]++')(ctx),3)
  is(ctx.b.c,4)

  is(script('b[d[0]]++')(ctx),4)
  is(ctx.b.c,5)

  is(script('a++, b.c++')(ctx),5)
  is(ctx.a,3)
  is(ctx.b.c,6)
})
test('unaries: postfix', t => {
  let ctx = {a:2}
  is(script('a--')(ctx),2)
  is(ctx.a,1)
  is(script('a++')(ctx),1)
  is(ctx.a,2)
  is(script('a ++')(ctx), 2)
  is(script('a  --')(ctx), 3)
  // evalTest('a++(b)',{})
})

test('prop access', t => {
  evalTest('a["b"]["c"][0]',{a:{b:{c:[1]}}})
  is(script('a.b.c')({a:{b:{c:[1]}}}), [1])
  // NOTE: invalid JS
  // is(script('a.b.c.0')({a:{b:{c:[1]}}}), 1)
})

test('parens', t => {
  evalTest('1+(b)()', {b:v=>1})
  evalTest('(1)+-b()', {b:v=>1})
  evalTest('1+a(b)', {b:1,a:v=>v+1})
  evalTest('1+(b)', {b:1})
  evalTest('1+-(b)', {b:1})
  evalTest('(b)', {b:1})
  evalTest('+b', {b:1})
  evalTest('+(b)', {b:1})
  evalTest('+((b))', {b:1})
  is(script('++(b)')({b:1}), 2)
  // NOTE: invalid in JS
  // is(script('++a(b)')({b:1, a:v=>v+1}),3)
  is(script('!a(b)')({a:v=>v,b:false}),true)
  evalTest('+(b)', {b:1})
  evalTest('1+(b)', {b:1})
  evalTest('1+((b))', {b:1})
  evalTest('(1)+-b', {b:1})
  evalTest('x[1]+-b', {b:1, x:[,2]})
  evalTest('x[+-1]', {b:1, x:[,2]})
  evalTest('(+-1)', {b:1})
  evalTest('x(+-1)', {b:1, x:v=>v+1})
  evalTest('(1,2,3)', {b:1})
})

test('functions', t => {
  evalTest('a()', {a:v=>123})
  evalTest('a(1)', {a:(v)=>v})
  evalTest('a(1,2)', {a:(v,w)=>v+w})
  evalTest('(c,d)', {a:v=>++v, c:1,d:2})
  evalTest('a(b)(d)', {a:v=>w=>v+w, b:1,d:2})
  evalTest('a(b,c)(d)', {a:(v,w)=>z=>z+v+w, b:1,c:2,d:3})
  evalTest('(c)(e)', {c:v=>++v, e:1})
  evalTest('b(c,d)', {b:(v,w)=>v+w, c:1,d:2})
  evalTest('b(c)(e)', {b:v=>w=>v+w, c:1,e:2})
  evalTest('(c,d)(e)', {d:v=>++v, c:1, e:1})
  evalTest('a.b(c,d)', {a:{b:(v,w)=>w+v}, c:1,d:2})
  evalTest('a.b(c.d)', {a:{b:(v)=>++v}, c:{d:2}})
})

test('chains', t => {
  evalTest('a["b"]["c"]["d"]',{a:{b:{c:{d:1}}}})
  evalTest('a.b.c.d',{a:{b:{c:{d:1}}}})
  evalTest('a.f',{a:{f:1}})
  evalTest('a.b[c.d].e.f',{a:{b:{d:{e:{f:1}}}}, c:{d:'d'}})
  evalTest('a.b(1)(2).c',{a:{b:v=>w=>({c:v+w})}})
  evalTest('a.b(1)(2)',{a:{b:v=>w=>v+w}})
  evalTest('a()()()',{a:()=>()=>()=>2})
  evalTest('a( )( )( )',{a:()=>()=>()=>2})
  evalTest('a.b()()',{a:{b:()=>()=>2}})
  evalTest('(a)()()',{a:()=>()=>2})
  evalTest('a.b(c.d).e.f',{a:{b:v=>({e:{f:v}})}, c:{d:123}})
  evalTest('(c.d).e', {c:{d:{e:1}}})
  evalTest('a.b(c.d).e(f).g()',{a:{b:v=>({e:w=>({g:()=>v+w})})}, c:{d:123}, f:456})
  evalTest('a.b[c.d].e', {a:{b:[,{e:1}]}, c:{d:1}})
  evalTest('a.b[c.d].e(g.h)', {a:{b:[,{e:v=>v}]}, c:{d:1}, g:{h:2}})
  evalTest('a(b)(c)', {a:v=>w=>v+w, b:1, c:2})
  evalTest('a(1,2)(b)', {a:(v,w)=>z=>v+w+z, b:1})
  evalTest('(1,a)(b)', {a:v=>v, b:1})
  evalTest('+(1,a)(b)', {a:v=>v, b:1})
  evalTest('a[b][c]', {a:{b:{c:1}}, b:'b', c:'c'})
  evalTest('a[1](b)["c"]', {a:[,v=>({c:v})], b:1})
  evalTest('a(1)[b]("c")', {a:v=>({b:w=>v+w}), b:'b'})
  evalTest('a[1][b]["c"]', {a:[,{b:{c:1}}], b:'b', c:'c'})
  evalTest('a(1)(b)("c")', {a:v=>w=>z=>v+w+z, b:'b'})
})

test('ext: in operator', t => {
  binary('in', 10, (a,b) => a in b)

  evalTest('inc in bin', {bin:{inc:1}, inc:'inc'})
  evalTest('bin in inc', {inc:{bin:1}, bin:'bin'})
  evalTest('bin in(inc)', {bin:'bin', inc:{bin:1}})
  throws(() => script('b inc'))
})

test('ext: list', t => {
  const prev = operator['[']
  operator['['] = (a,b) => b ? prev(a,b) : (
    !a ? ctx => [] : // []
      a[0] === ',' ? (a=a.slice(1).map(compile), ctx => a.map(a=>a(ctx))) : // [a,b,c]
      (a=compile(a), ctx => [a(ctx)]) // [a]
  )

  is(script('[1,2,3,4,5,6]')(),[1,2,3,4,5,6])
  is(script('[1,2,3,4,5]')(),[1,2,3,4,5])
  is(script('[1,2,3,4]')(),[1,2,3,4])
  is(script('[1,2,3]')(),[1,2,3])
  is(script('[1]')(),[1])
  is(script('[1]+[2]')(),'12')

  is(script('[]')(), [])
  is(script('[ ]')(), [])

  // TODO: prefix/postfix maybe?
  // is(script('[1,]')({}),[1])
  // is(script('[,]')({}),[undefined])
  // is(script('[1,,2,"b"]')({b:3}),[1,undefined,2,'b'])
  // is(script('[,,2,"b"]')({b:3}),[undefined,undefined,2,'b'])
  // is(script('[1,,2,b]')({b:3}),[1,undefined,2,3])

  evalTest('[1]')
  evalTest('[1,2,3]')
  evalTest('[0]',{})
  evalTest('[""]',{})
  evalTest('[true]',{})
  evalTest('[false]',{})
  evalTest('[null]',{})
  evalTest('[undefined]',{})
})


test('ext: ternary', t => {
  token(':', (a, b) => [':', a, expr(3.1)], 3.1)
  token('?', (a, b) => a && (b=expr(3)) && ['?:', a, b[1], b[2]], 3)

  operator['?:'] = (a,b,c) => (a=compile(a),b=compile(b),c=compile(c), ctx => a(ctx) ? b(ctx) : c(ctx))

  evalTest('a?b:c', {a:true,b:1,c:2})
  evalTest('a?b:c', {a:false,b:1,c:2})
  evalTest('a((1 + 2), (e > 0 ? f : g))', {a:(x,y)=>x+y, e:1, f:2, g:3})

})

test('ext: object', t => {
  token('{', (a, args) => !a && (
      a=expr(0,125),
      !a ? ctx => {} : ctx => (args=(a.all||a)(ctx), Object.fromEntries(a.all?args:[args]))
    )
  )
  token(':', (a, prec, b) => (b=expr(1.1)||err(), ctx => [(a.id||a)(ctx), b(ctx)]), 1.1 )
  operator('=', (a,b)=>b, 2)

  evalTest('{}',{})
  evalTest('{x: 1}',{})
  evalTest('{x: 1, "y":2}',{})
  evalTest('{x: 1+2, y:a(3)}',{a:v=>v+1})
  evalTest('{x: 1+2, y:a(3)}',{a:x=>x*2})
  evalTest('{1: 2}')
  // evalTest('{x}',{x:1})

  evalTest('{a:b?c:d}', {b:2,c:3,d:4})
  evalTest('{a:b?c:d, e:!f?g:h}', {b:2,c:3,d:4,f:1,g:2,h:3})
  evalTest('{a:b?c:d, e:f=g?h:k}', {b:2,c:3,d:4, f:null, g:0,h:1,k:2})

  evalTest('b?{c:1}:{d:2}', {b:2})
})

test('ext: justin', async t => {
  const {default: script} = await import('../justin.js')
  evalTest(`"abcd" + 'efgh'`)
  is(script('a;b')({a:1,b:2}), 2)
  evalTest('{x:~1, "y":2**2}["x"]', {})
  evalTest('{x:~1, "y":2**2}["x"]', {})
  evalTest('{x:~1, "y":2**2}["y"]', {})
  evalTest('e > 0 ? f : g', {e:1, f:2, g:3}, 2)
  evalTest('a((1 + 2), (e > 0 ? f : g))', {a:(v,w)=>v+w, e:1, f:2, g:3})


  evalTest('{x: 1+2, y:a(3)}',{a:x=>x*2})
  evalTest('{a:b?c:d, e:!f?g:h}', {b:2,c:3,d:4,f:1,g:2,h:3})
  evalTest('b?{c:1}:{d:2}', {b:2})
})

test('ext: comments', t => {
  token('/*', (a, prec) => (skip(c => c !== 42 && cur.charCodeAt(idx+1) !== 47), skip(2), a||expr(prec)) )
  token('//', (a, prec) => (skip(c => c >= 32), a||expr(prec)) )
  is(script('/* x */1/* y */+/* z */2')({}), 3)
  is(script(`a /
    // abc
    b`)({a:1,b:2}), 1/2)
  is(script(`"a" + "b" // concat`)(), 'ab')
})

test('unfinished sequences', async t => {
  throws(() => script('a+b)+c'))//, ['+','a','b'])
  throws(() => script('(a+(b)))+c'))//, ['+','a','b'])
  throws(() => script('a+b+)c'))//, ['+','a','b',null])
})

test('err: unknown operators', t => {
  throws(() => script('a <<< b'))
  throws(() => script('a >== b'))
  throws(() => script('a -> b'))
  throws(() => script('a ->'))
  throws(() => script('-> a'))
  throws(() => script('#a'))
  // throws(() => script('~a'))
  throws(() => script('a !'))
  throws(() => script('a#b'))
  throws(() => script('b @'))
})

test('err: missing arguments', t => {
  throws(() => console.log(script('a[]')))
  throws(() => console.log(script('a[  ]')))
  throws(() => console.log(script('()+1')))
  throws(() => console.log(script('(  )+1')))
  throws(() => console.log(script('a+')))
  throws(() => console.log(script('(a / )')))
})
test('err: unclosed parens', t => {
  throws(() => script('a[  '))
  throws(() => script('(  +1'))
  throws(() => script('(a / '))
  throws(() => script('( '))
  throws(() => script('a )'))
  throws(() => script(')'))
  throws(() => script('+)'))
})

test('err: wrong sequences', t => {
  throws(() => script('a b'))
  throws(() => script('a 1'))
  throws(() => script('a "a"'))
  throws(() => script('"a" a'))
  throws(() => script('"a" "b"'))
  throws(() => script('"a" 1'))
  throws(() => script('1 "a"'))
  throws(() => script('true false'))
  throws(() => script('null null'))
})

test('low-precedence unary', t => {
  operator('&',(a=0)=>~a, 13)
  is(script('&a+b*c')({a:1,b:2,c:3}), 4)
  is(script('&a*b+c')({a:1,b:2,c:3}), 0)
})

test('stdlib cases', t => {
  is(script('pow(a, 3)')({pow:Math.pow, a:1}), 1)
  is(script('Math.pow(a, 3)')({Math, a:1}), 1)
  is(script('Math.pow(a, 3) / 2 + b * 2 - 1')({Math, a:1, b:1}), 1.5)
})

test('ext: collect args', async t => {
  const {lookup} = await import('../parse.js')
  const {default: script} = await import('../justin.js')

  let args = [], id = lookup[0]
  lookup[0] = a => (a=id(), a?.id && args.push(a.id()), a)

  let fn = script('Math.pow(), a.b(), c + d() - e, f[g], h in e, true, {x: "y", "z": w}, i ? j : k')
  same(args,
    ['Math', 'a', 'c', 'd', 'e', 'f', 'g', 'h', 'e', 'x', 'w', 'i', 'j', 'k']
  )
})
