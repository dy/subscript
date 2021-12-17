import test, {is, any, throws} from '../lib/test.js'
import script from '../subscript.js'
import { skip, code, char, expr, operator, err } from '../index.js'

const evalTest = (str, ctx={}) => {
  let ss=script(str), fn=new Function(...Object.keys(ctx), 'return ' + str)

  return is(ss(ctx), fn(...Object.values(ctx)))
}

test('basic', t => {
  // FIXME: tests can be rewritten to compare with eval.
  is(script`1 + 2`(), 3)
  is(script`1 + 2 + 3`(), 6)
  is(script('1 + 2 * 3')(), 7)
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
  is(script(`a(1)`)({a:v=>v}), 1)
  is(script(`a(1).b`)({a:v=>({b:v})}), 1)
  is(script(`a ( c ) . e`)({ a:v=>({e:v}), c:1 }), 1)
  is(script('a[b][c]')({a:{b:{c:1}}, b:'b', c:'c'}), 1)
  is(script('a.b.c')({a:{b:{c:1}}}), 1)
  is(script('a.b.c(d).e')({a:{b:{c:e=>({e})}}, d:1}), 1)
  is(script(`+-2`)(), -2)
  is(script(`+-a.b`)({a:{b:1}}), -1)
  is(script(`1+-2`)(), -1)
  is(script(`-a.b+1`)({a:{b:1}}), 0)
  is(script(`-a-b`)({a:1,b:2}), -3)
  is(script(`+-a.b+-!1`)({a:{b:1}}), -1)

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

  // **
  operator('**', 14, (a,b)=>a**b)

  evalTest('1 + 2 * 3 ** 4 + 5', {})
  evalTest(`a + b * c ** d | e`, {a:1,b:2,c:3,d:4,e:5})
  evalTest(`"abcd" + "efgh"`)

  evalTest('x(a + 3)',{x:v=>v+1,a:3})
  evalTest('1 + x(a.b + 3.5)', {x:v=>v+1, a:{b:1}})
  evalTest('a[b]', {a:{x:1}, b:'x'})
  evalTest('(a(b) + 3.5)', {a:v=>v*2, b:3})
  evalTest('1 + x(a[b] + 3.5)', {x:v=>v+1, a:{y:1}, b:'y'})
  evalTest('x.y.z,123', {x:{y:{z:345}}})
  evalTest('x.y.z(123)', {x:{y:{z:x=>x}}})
  evalTest('x.y.z(123 + c[456]) + n', {x:{y:{z:v=>v+1}}, c:{456:789}, n:1})
  evalTest('1 || 1')
  evalTest('-1%2')
  evalTest('-(1%2)')
  evalTest('+1 * (a.b - 3.5) - "asdf" || x.y.z(123 + c[456]) + n', {a:{b:1}, x:{y:{z:v=>v}}, c:{456:789}, n:1})
})

test('readme', t => {
  evalTest(`a.b + c(d-1)`, {a:{b:1}, c:x=>x*2, d:3})
  evalTest(`min * 60 + "sec"`, {min: 5})
})


test('ext: interpolate string', t => {
  is(script`a+1`({a:1}), 2)
})

test.todo('strings', t => {
  is(parse('"a'), '@a')
  is(parse('a + b'), ['+', 'a', 'b'])
  is(parse('"a" + "b'), ['+', '@a', '@b'])
  is(parse('"a" + ("1" + "2")'), ['+', '@a', ['+', '@1', '@2']])

  // parse.quote['<?']='?>'
  // is(parse('"abc" + <?js\nxyz?>'), ['+','"abc','<?js\nxyz?>'])

  // parse.quote['<--']='-->'
  // is(parse('"abc" + <--js\nxyz-->'), ['+','"abc','<--js\nxyz-->'])
})
test.todo('ext: literals', t=> {
  parse.literal.push(c =>
    skip('true') ? true :
    skip('false') ? false :
    skip('null') ? null :
    skip('undefined') ? undefined :
    // c === 116 && char(4) === 'true' && skip(4) ? true :
    // c === 102 && char(5) === 'false' && skip(5) ? false :
    // c === 110 && char(4) === 'null' && skip(4) ? null :
    // c === 117 && char(9) === 'undefined' && skip(9) ? undefined :
    null
  )
  // operator('null',30,node=>!node&&(skip(4),v(null)))
  // operator('false',30,node=>!node&&(skip(5),v(false)))
  // operator('true',30,node=>!node&&(skip(4),v(true)))
  // operator('undefined',30,node=>!node&&(skip(9),v(undefined)))

  is(parse('null'), null)
  is(parse('(null)'), null)
  is(parse('!null'), ['!',null])
  is(parse('null++'), ['++',null])
  is(parse('false++'), ['++',false])
  is(parse('++false'), ['++',false])
  is(parse('(a)(null)'), ['a',null])
  is(parse('false&true'), ['&',false,true])
  is(parse('(false)||((null))'), ['||',false,null])
  // parse.literal['undefined'] = undefined
  is(parse('undefined'), undefined)
  is(parse('(undefined)'), undefined)
  is(parse('true||((false))'), ['||', true, false])
  is(parse('a(true)'), ['a', true])
  is(parse('a0'), 'a0')
  is(evaluate(parse('x(0)'),{x:v=>!!v}), false)
  is(evaluate(parse('x(true)'),{x:v=>!!v}), true)
})

test('bad number', t => {
  is(script('-1.23e-2')(), -1.23e-2)
  throws(t=>script('.e-1')())
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
test('unaries', t => {
  evalTest('-2')
  evalTest('+-2')
  evalTest('-+-2')
  evalTest('-+!2')
  evalTest('1-+-2')
  evalTest('1-+!2')
  evalTest('1 * -1')
})
test('postfix unaries', t => {
  evalTest('a--',{a:2})
  evalTest('a++',{a:2})
  // evalTest('a++(b)',{})
})

test('prop access', t => {
  evalTest('a["b"]["c"][0]',{a:{b:{c:[1]}}})
  is(script('a.b.c.0')({a:{b:{c:[1]}}}), 1)
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
  evalTest('++(b)', {b:1})
  is(script('++a(b)')({b:1, a:v=>v+1}),3)
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
  evalTest('a.b[c.d].e.f',{a:{b:{d:{e:{f:1}}}}, c:{d:'d'}})
  evalTest('a.b(1)(2).c',{a:{b:v=>w=>({c:v+w})}})
  evalTest('a.b(1)(2)',{a:{b:v=>w=>v+w}})
  evalTest('a()()()',{a:()=>()=>()=>2})
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
  operator('in', 10, (a,b) => a in b)

  evalTest('inc in bin', {bin:{inc:1}, inc:'inc'})
  evalTest('bin in inc', {inc:{bin:1}, bin:'bin'})
  evalTest('bin in(inc)', {bin:'bin', inc:{bin:1}})
  throws(() => script('b inc'))
})

test('ext: ternary', t => {
  evaluate.operator('?:', (a,b,c)=>a?b:c)
  parse.operator('?', 3, (node) => {
    if (!node) err('Expected expression')
    let a, b
    skip(), parse.space(), a = expr()
    return ['?:', node, a[1], a[2]]
  })
  operator(':', 2)

  is(parse('a ? b : c'), ['?:','a','b','c']) // ['?:', 'a', 'b', 'c']
  is(parse('a((1 + 2), (e > 0 ? f : g))'), ['a',['+',1,2],['?:',['>','e',0],'f','g']])
  is(evaluate(parse('a?b:c'), {a:true,b:1,c:2}), 1)
  is(evaluate(parse('a?b:c'), {a:false,b:1,c:2}), 2)
})

test('ext: list', t => {
  // evaluate.operator('[', (...args) => Array(...args))
  // as operator it's faster to lookup (no need to call extra rule check) and no conflict with word ops
  operator('[', 20, (node,arg) => (
    skip(), arg=expr(), skip(),
    !arg ? ['['] : arg[0] === ',' ? (arg[0]='[',arg) : ['[',arg]
  ))

  is(parse('[]'))
  is(parse('[1]'),['[',1])
  is(parse('[1,2,3]'),['[',1,2,3])
  is(parse('[1]+[2]'),['+',['[',1],['[',2]])

  // NOTE: not critical, but generalizes expression errors across envs
  // is(parse('[1,,2,b]'),['[',1,undefined,2,'b'])
  // is(evaluate(parse('[1,,2,b]'),{b:3}),[1,undefined,2,3])

  is(evaluate(parse('[]')),[])
  is(evaluate(parse('[1]')),[1])
  is(evaluate(parse('[1,2,3]')),[1,2,3])
})

test('ext: object', t => {
  operator('{', 20, (node,arg) => !node && (skip(), arg=expr(0,125),
    !arg ? ['{'] : arg[0] == ':' ? ['{',strkey(arg)] : arg[0] == ',' ? (arg[0]='{',arg.map(strkey)) : ['{',arg])
  )
  const strkey = a => Array.isArray(a) ? (a[1]=(a[1][0]==='@'?'':'@')+a[1],a) : a
  operator('}')
  operator(':',2)
  evaluate.operator('{', (...args)=>Object.fromEntries(args))
  evaluate.operator(':', (a,b)=>[a,b])

  is(parse('{}'), ['{'])
  is(parse('{x}'), ['{','x'])
  is(parse('{x: 1}'), ['{',[':', '@x', 1]])
  is(parse('{x: 1, "y":2}'), ['{', [':','@x',1], [':','@y',2]])
  is(parse('{x: 1+2, y:a(3)}'), ['{', [':','@x',['+',1,2]], [':', '@y',['a',3]]])
  is(evaluate(parse('{x: 1+2, y:a(3)}'),{a:x=>x*2}), {x:3, y:6})
})

test('ext: justin', async t => {
  const {parse} = await import('../justin.js')
  is(parse(`"abcd" + 'efgh'`), ['+','@abcd','@efgh'])
  is(parse('a;b'), [';','a','b'])
  is(parse('{x:~1, "y":2**2}["x"]'), ['.', ['{', [':','@x',['~',1]], [':','@y',['**',2,2]]], '@x'])
  is(parse('a((1 + 2), (e > 0 ? f : g))'), ['a',['+',1,2],['?:',['>','e',0],'f','g']])
  is(evaluate(parse('{x:~1, "y":2**2}["x"]')), -2)
})

test('ext: comments', t => {
  parse.space = cc => {
    let x = 0
    while (cc = code(), cc <= 32 || cc === 47) {
      if (cc <= 32) skip()
      else if (cc === 47)
        // /**/
        if (code(1) === 42) skip(2), skip(c => c !== 42 && code(1) !== 47), skip(2)
        // //
        else if (code(1) === 47) skip(2), skip(c => c >= 32)
        else break
    }
    return cc
  }
  is(parse('/* x */1/* y */+/* z */2'), ['+', 1, 2])
  is(parse(`a /
    // abc
    b`), ['/', 'a', 'b'])
  is(parse(`"a" + "b" // concat`),['+','@a','@b'])
})

test('unfinished sequences', async t => {
  throws(() => parse('a+b)+c'))//, ['+','a','b'])
  throws(() => parse('(a+(b)))+c'))//, ['+','a','b'])
  throws(() => parse('a+b+)c'))//, ['+','a','b',null])
})

test('non-existing operators', t => {
  throws(() => parse('a <<< b'))
  throws(() => parse('a >== b'))
  throws(() => parse('a -> b'))
})

test('low-precedence unary', t => {
  parse.operator('&',13,-1)
  is(parse('&a+b*c'), ['+',['&','a'],['*','b','c']])
  is(parse('&a*b+c'), ['+',['&',['*','a','b']],'c'])
})

test('eval: edge cases', t => {
  is(evaluate(parse('pow(a, 3)'), {pow:Math.pow, a:1}), 1)
  is(evaluate(parse('Math.pow(a, 3)'), {Math, a:1}), 1)
  is(evaluate(parse('Math.pow(a, 3) / 2 + b * 2 - 1'), {Math, a:1, b:1}), 1.5)
})
