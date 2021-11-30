import test, {is, any, throws} from '../lib/test.js'
import subscript, { parse, evaluate } from '../subscript.js'
import { skip, code, char, expr, operator } from '../parse.js'

test('parse: basic', t => {
  any(parse('1 + 2 + 3'), ['+', ['+', 1, 2], 3],   ['+', 1, 2, 3])
  is(parse('1 + 2 * 3'), ['+',1, ['*', 2, 3]])
  any(parse('1 + 2 + 3 + 4'), ['+', ['+', ['+', 1, 2], 3], 4],   ['+', 1, 2, 3, 4])
  is(parse('1 * 2 + 3'), ['+', ['*', 1, 2], 3])
  any(parse('1 + 2 * 3 + 4'), ['+', ['+', 1, ['*', 2, 3]], 4],    ['+', 1, ['*', 2, 3], 4])
  is(parse(`(1+2)`), ['+',1, 2])
  is(parse(`1+(2+3)`), ['+',1, ['+',2,3]])
  is(parse(`1+(2)`), ['+',1, 2])
  any(parse(`1+(2)+3+((4))`), ['+',['+',['+',1, 2],3],4],  ['+',1, 2,3,4])
  is(parse(`-2`), ['-',2])
  is(parse(`a ( c ) . e`), ['.',['a', 'c'], '"e"'])
  is(parse(`a(1)`), [['a'], 1])
  is(parse(`a(1).b`), ['.',[['a'], 1],'"b"'])
  any(parse('a[b][c]'),['.','a', 'b', 'c'], ['.',['.', 'a', 'b'], 'c'])
  any(parse('a.b.c'), ['.',['.','a','"b"'],'"c"'],    ['.','a','"b"','"c"'])
  any(parse('a.b.c(d).e'), ['.',[['.',['.','a','"b"'],'"c"'],'d'],'"e"'],    ['.',[['.','a','"b"','"c"'],'d'],'"e"'])
  is(parse(`+-2`), ['+',['-',2]])
  is(parse(`+-a.b`), ['+',['-',['.','a','"b"']]])
  is(parse(`1+-2`), ['+',1,['-',2]])
  is(parse(`-a.b+1`), ['+',['-',['.','a','"b"']], 1])
  is(parse(`-a-b`), ['-',['-','a'], 'b'])
  is(parse(`+-a.b+-!1`), ['+',['+',['-',['.','a','"b"']]], ['-',['!',1]]])

  is(parse(`   .1   +   -1.0 -  2.3e+1 `), ['-', ['+', .1, ['-',1]], 23])
  is(parse(`( a,  b )`), [',','a','b'])
  is(parse(`a (  ccc. d,  -+1.0 )`), ['a', ['.', 'ccc', '"d"'], ['-',['+',1]]])

  is(parse(`a.b (  ccc. d , -+1.0 ) . e`), ['.',[['.', 'a', '"b"'], ['.', 'ccc', '"d"'], ['-',['+',1]]], '"e"'])
  is(parse(`a * 3 / 2`), ['/',['*','a',3],2])
  is(parse(`(a + 2) * 3 / 2 + b * 2 - 1`), ['-',['+',['/',['*',['+', 'a', 2],3],2],['*', 'b', 2]],1])
  is(parse('a()()()'),[[['a']]])
  is(parse('a(b)(c)'),[['a', 'b'],'c'])

  // **
  operator('**', 14)

  any(parse('1 + 2 * 3 ** 4 + 5'), ['+', ['+', 1, ['*', 2, ['**', 3, 4]]], 5],  ['+', 1, ['*', 2, ['**', 3, 4]], 5])
  is(parse(`a + b * c ** d | e`), ['|', ['+', 'a', ['*', 'b', ['**','c', 'd']]], 'e'])
  // is(parse(`"abcd" + 'efgh'`), ['+','"abcd"',"'efgh'"])
  is(parse(`"abcd" + "efgh"`), ['+','"abcd"','"efgh"'])

  any(parse('0 + 1 + 2.0'), ['+',['+',0,1],2],  ['+',0,1,2])
  is(parse('0 + (1 + 2)'), ['+',0,['+',1,2]])
  is(parse('-2 - 2'), ['-',['-',2],2])
  is(parse('0 + 1 - 2'), ['-',['+',0,1],2])
  is(parse('0 - 1 + 2'), ['+',['-',0,1],2])
  any(parse('0 + 1 + 2 - 1 - 2 + 1'), ['+',['-',['-',['+',['+',0,1],2],1],2],1], ['+',['-',['+',0,1,2],1,2],1])
  any(parse('0 * 1 * 2 / 1 / 2 * 1'), ['*',['/',['/',['*',['*',0,1],2],1],2],1], ['*',['/',['*',0,1,2],1,2],1])
  is(parse('0 + 1 - 2 * 3'), ['-',['+',0,1],['*',2,3]])
  is(parse('1 * 2 - 3'), ['-',['*',1,2],3])
  is(parse('a.b'), ['.','a','"b"'])
  any(parse('1 + a.b + 3.5'), ['+',['+',1,['.','a','"b"']],3.5], ['+',1,['.','a','"b"'],3.5])
  is(parse('1 + (a.b + 3.5)'), ['+',1,['+',['.','a','"b"'],3.5]])
  is(parse('x(a + 3)'), ['x',['+','a',3]])
  is(parse('1 + x(a.b + 3.5)'), ['+',1,['x',['+',['.','a','"b"'],3.5]]])
  is(parse('a[b]'), ['.','a','b'])
  is(parse('(a(b) + 3.5)'), ['+',['a','b'],3.5])
  is(parse('1 + x(a[b] + 3.5)'), ['+',1,['x',['+',['.','a','b'],3.5]]])
  any(parse('x.y.z,123'), [',',['.','x','"y"','"z"'],123],  [',',['.',['.','x','"y"'],'"z"'],123])
  any(parse('x.y.z(123)'), [['.','x','"y"','"z"'],123],[['.',['.','x','"y"'],'"z"'],123])
  any(parse('x.y.z(123 + c[456]) + n'), ['+',[['.','x','"y"','"z"'],['+',123,['.','c',456]]],'n'],   ['+', [['.',['.','x','"y"'],'"z"'],['+',123, ['.','c',456]]],'n'])
  is(parse('1 || 1'), ['||', 1, 1])
  is(parse('-1%2'), ['%',['-',1], 2])
  is(parse('-(1%2)'), ['-',['%',1, 2]])
  any(parse('+1 * (a.b - 3.5) - "asdf" || x.y.z(123 + c[456]) + n'),
    ['||',
      ['-',['*',['+',1],['-',['.','a','"b"'],3.5]], '"asdf"'],
      ['+',[['.','x','"y"','"z"'], ['+',123,['.','c',456]]],'n']
    ],
    ['||',
      ['-',['*',['+',1],['-',['.','a','"b"'],3.5]], '"asdf"'],
      ['+',[['.',['.','x','"y"'],'"z"'], ['+',123,['.','c',456]]],'n']
    ]
  )
})

test('readme', t => {
  let fn = subscript(`a.b + c(d-1)`)
  is(fn({a:{b:1}, c:x=>x*2, d:3}), 5)

  // parse.quote["'"] = "'"
  // is(parse("'a' + 'b'"), ['+', "'a'", "'b'"])

  is(evaluate(['+', ['*', 'min', 60], new String('sec')], {min: 5}), "300sec")
})


test.todo('ext: interpolate string', t => {
  is(parse`a+1`, ['+','a',1])
  is(subscript`a+1`({a:1}), 2)
})

test('parse: strings', t => {
  is(parse('"a"'), '"a"')
  is(parse('a + b'), ['+', 'a', 'b'])
  is(parse('"a" + "b"'), ['+', '"a"', '"b"'])
  is(parse('"a" + ("1" + "2")'), ['+', '"a"', ['+', '"1"', '"2"']])

  // parse.quote['<?']='?>'
  // is(parse('"abc" + <?js\nxyz?>'), ['+','"abc"','<?js\nxyz?>'])

  // parse.quote['<--']='-->'
  // is(parse('"abc" + <--js\nxyz-->'), ['+','"abc"','<--js\nxyz-->'])
})
test('ext: literals', t=> {
  const v = v => ({valueOf:()=>v})
  parse.token.splice(2,0, c =>
    c === 116 && char(4) === 'true' && skip(4) ? v(true) :
    c === 102 && char(5) === 'false' && skip(5) ? v(false) :
    c === 110 && char(4) === 'null' && skip(4) ? v(null) :
    c === 117 && char(9) === 'undefined' && skip(9) ? v(undefined) :
    null
  )
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

test('parse: bad number', t => {
  is(parse('-1.23e-2'),['-',1.23e-2])
  throws(t => parse('.e-1'))
})

test('parse: intersecting binary', t => {
  is(parse('a | b'), ['|', 'a', 'b'], 'a|b')
  is(parse('a || b'), ['||', 'a', 'b'], 'a||b')
  is(parse('a & b'), ['&', 'a', 'b'], 'a&b')
  is(parse('a && b'), ['&&', 'a', 'b'], 'a&&b')

  is(parse('a >> b'), ['>>', 'a', 'b'], 'a>>b')
  is(parse('a >>> b'), ['>>>', 'a', 'b'], 'a>>>b')
})
test('parse: signs', t => {
  is(parse('+-1'),['+',['-',1]])
  is(parse('a(+1)'),['a',['+',1]])
  is(parse('a[+1]'),['.', 'a',['+',1]])
  is(parse('a+(1)'),['+','a',1])
  is(parse('a+!1'),['+','a',['!',1]])
  is(parse('a+-1'),['+','a',['-',1]])
  is(parse('1+-1.23e-2-1.12'),['-',['+',1,['-',1.23e-2]], 1.12])
  is(parse('-+(1)'),['-',['+',1]])
  is(parse('+1.12-+-a+-(+1)'),['+', ['-',['+',1.12],['+',['-','a']]],['-',['+',1]]])
  is(parse('+1.12-+-a[+1]'),['-',['+',1.12],['+',['-',['.','a',['+',1]]]]])
  is(parse('+1-+-1'),['-',['+',1],['+',['-',1]]])
  is(parse('-a[1]'),['-',['.','a',1]])
  is(parse('-a.b[1](2)'),['-',[['.',['.','a','"b"'], 1], 2]])
  is(parse('+1-+-a[1]'),['-',['+',1],['+',['-',['.','a',1]]]])
  is(parse('+1 + +2'),['+',['+',1],['+',2]])
  is(parse('+1 + -2'),['+',['+',1],['-',2]])
  is(parse('+1 -+2'),['-',['+',1],['+',2]])
  is(parse('1 -2'),['-',1,2])
  is(parse('+1 -2'),['-',['+',1],2])
  is(parse('-1 +2'),['+',['-',1],2])
})
test('parse: unaries', t => {
  is(parse('-2'),['-',2])
  is(parse('+-2'),['+',['-',2]])
  is(parse('-+-2'),['-',['+',['-',2]]])
  is(parse('-+!2'),['-',['+',['!',2]]])
  is(parse('1-+-2'),['-',1,['+',['-',2]]])
  is(parse('1-+!2'),['-',1,['+',['!',2]]])
  is(parse('1 * -1'),['*',1,['-',1]])
})
test('parse: postfix unaries', t => {
  is(parse('2--'),['--',2])
  is(parse('2++'),['++',2])
  is(parse('1++(b)'),[['++',1],'b']) // NOTE: not supported by JS btw
})

test('parse: prop access', t => {
  any(parse('a["b"]["c"][0]'),['.',['.',['.','a','"b"'],'"c"'],0],  ['.', 'a', '"b"', '"c"', 0])
  any(parse('a.b.c.0'), ['.',['.',['.','a','"b"'],'"c"'],0],  ['.', 'a', '"b"', '"c"', 0])
  is(evaluate(['.','a','"b"','c',0], {a:{b:{c:[2]}}}), 2)
  is(evaluate(['.',['.',['.','a','"b"'],new String('c')],0], {a:{b:{c:[2]}}}), 2)
})

test('parse: parens', t => {
  is(parse('1+(b)()'),['+',1,['b']])
  is(parse('(1)+-b()'),['+',1,['-',['b']]])
  is(parse('1+a(b)'),['+',1,['a','b']])
  is(parse('1+(b)'),['+',1,'b'])
  is(parse('1+-(b)'),['+',1,['-','b']])
  is(parse('(b)'),'b')
  is(parse('+b'),['+','b'])
  is(parse('+(b)'),['+','b'])
  is(parse('+((b))'),['+','b'])
  is(parse('++(b)'),['++','b'])
  is(parse('++a(b)'),['++',['a', 'b']])
  is(parse('+(b)'),['+','b'])
  is(parse('1+(b)'),['+',1,'b'])
  is(parse('1+((b))'),['+',1,'b'])
  is(parse('(1)+-b'),['+',1,['-','b']])
  is(parse('x[1]+-b'),['+',['.','x',1],['-','b']])
  is(parse('x[+-1]'),['.','x',['+',['-',1]]])
  is(parse('(+-1)'),['+',['-',1]])
  is(parse('x(+-1)'),['x',['+',['-',1]]])
  is(parse('(1,2,3)'),[',',1,2,3])
})

test('parse: functions', t => {
  is(parse('a()'),['a'])
  is(parse('(c,d)'),[',', 'c','d'])
  is(parse('a(b)(d)'),[['a', 'b'], 'd'])
  is(parse('a(b,c)(d)'),[['a', 'b','c'], 'd'])
  is(parse('(c)(e)'),['c','e'])
  is(parse('b(c,d)'),['b', 'c','d'])
  is(parse('b(c)(e)'),[['b', 'c'],'e'])
  is(parse('(c,d)(e)'),[[',', 'c','d'],'e'])
  is(parse('a.b(c,d)'),[['.','a','"b"'], 'c','d'])
  is(parse('a.b(c.d)'),[['.','a','"b"'],['.', 'c','"d"']])
})

test('parse: chains', t => {
  any(parse('a["b"]["c"]["d"]'),['.','a','"b"','"c"','"d"'], ['.',['.',['.','a','"b"'],'"c"'],'"d"'])
  any(parse('a.b.c.d'),['.','a','"b"','"c"','"d"'], ['.',['.',['.','a','"b"'],'"c"'],'"d"'])
  any(parse('a.b[c.d].e.f'),['.',['.',['.',['.','a','"b"'], ['.','c','"d"']],'"e"'],'"f"'],  ['.',['.',['.','a','"b"'],['.','c','"d"']],'"e"','"f"'])
  is(parse('a.b(1)(2).c'),['.',[[['.','a','"b"'],1],2], '"c"'])
  is(parse('a.b(1)(2)'),[[['.','a','"b"'],1],2])
  is(parse('a()()()'),[[['a']]])
  is(parse('a.b()()'),[[['.','a','"b"']]])
  is(parse('(a)()()'),[['a']])
  any(parse('a.b(c.d).e.f'),['.',['.',[['.','a','"b"'],['.','c','"d"']],'"e"'],'"f"'],  ['.',[['.','a','"b"'],['.','c','"d"']],'"e"','"f"'])
  any(parse('(c.d).e'),['.',['.', 'c','"d"'],'"e"'], ['.', 'c','"d"','"e"'])
  is(parse('a.b(c.d).e(f).g()'),[['.',[['.',[['.','a','"b"'],['.','c','"d"']],'"e"'],'f'],'"g"']])
  any(parse('a.b[c.d].e'),['.',['.',['.','a','"b"'],['.','c','"d"']],'"e"'],   ['.',['.','a','"b"'],['.','c','"d"'],'"e"'])
  any(parse('a.b[c.d].e(g.h)'),[['.',['.',['.','a','"b"'],['.','c','"d"']],'"e"'],['.','g','"h"']],  [['.',['.','a','"b"'],['.','c','"d"'],'"e"'], ['.','g','"h"']])
  is(parse('a(b)(c)'),[['a','b'],'c'])
  is(parse('a(1,2)(b)'),[['a',1,2],'b'])
  is(parse('(1,2)(b)'),[[',',1,2],'b'])
  is(parse('+(1,2)(b)'),['+',[[',',1,2],'b']])
  any(parse('a[b][c]'), ['.',['.','a','b'],'c'],  ['.','a','b','c'])
  is(parse('a[1](b)["c"]'),['.', [['.','a',1],'b'],'"c"'])
  is(parse('a(1)[b]("c")'),[['.',['a',1],'b'],'"c"'])
  any(parse('a[1][b]["c"]'), ['.',['.',['.','a',1],'b'],'"c"'], ['.','a',1,'b','"c"'])
  is(parse('a(1)(b)("c")'), [[['a', 1], 'b'], '"c"'])
})

test('eval: basic', t => {
  is(evaluate(['+', 1, 2]), 3)
  is(evaluate(['+', 1, ['-', 3, 2]]), 2)
  is(evaluate(['-', 5, 2, 1, 1]), 1)
  is(evaluate(['+',['-',1]]), -1)
  is(evaluate(['-',['+',1],2]), -1)
})

test('ext: in operator', t => {
  evaluate.operator('in', (a,b)=>a in b)
  parse.operator('in', 10, (node) => code(2) <= 32 && [skip(2), '"'+node+'"', expr(10)])

  is(parse('inc in bin'), ['in', '"inc"', 'bin'])
  is(parse('bin in inc'), ['in', '"bin"', 'inc'])
  throws(() => parse('b inc'))
  is(evaluate(parse('inc in bin'), {bin:{inc:1}}), true)
})

test('ext: ternary', t => {
  evaluate.operator('?:', (a,b,c)=>a?b:c)
  parse.operator('?', 3, (node) => {
    if (!node) err('Expected expression')
    let a, b
    skip(), parse.space(), a = expr()
    if (code() !== 58) err('Expected :')
    skip(), parse.space(), b = expr()
    return ['?:', node, a, b]
  })
  operator(':')

  is(parse('a ? b : c'),['?:','a','b','c']) // ['?:', 'a', 'b', 'c']
  is(evaluate(parse('a?b:c'), {a:true,b:1,c:2}), 1)
  is(evaluate(parse('a?b:c'), {a:false,b:1,c:2}), 2)
})

test('ext: list', t => {
  evaluate.operator('[', (...args) => Array(...args))
  // as operator it's faster to lookup (no need to call extra rule check) and no conflict with word ops
  operator('[', 20, (node,arg) => !node && (
    skip(), arg=expr(), skip(),
    !arg ? ['['] : arg[0] === ',' ? (arg[0]='[',arg) : ['[',arg]
  ))

  is(parse('[]'),['['])
  is(parse('[1]'),['[',1])

  // NOTE: not critical, but generalizes expression errors across envs
  // is(parse('[1,,2,b]'),['[',1,undefined,2,'b'])
  // is(evaluate(parse('[1,,2,b]'),{b:3}),[1,undefined,2,3])
  is(parse('[1]+[2]'),['+',['[',1],['[',2]])
})

test('ext: object', t => {
  operator('{', 20, (node,arg) => !node && (skip(), arg=expr(0,125), skip(),
    !arg ? ['{'] : arg[0] == ':' ? ['{',arg] : arg[0] == ',' ? (arg[0]='{',arg) : ['[',arg])
  )
  operator('}')
  operator(':', 4)
  evaluate.operator('{', (...args)=>Object.fromEntries(args))
  evaluate.operator(':', (a,b)=>[a,b])

  is(parse('{}'), ['{'])
  is(parse('{x: 1}'), ['{',[':', 'x', 1]])
  is(parse('{x: 1, "y":2}'), ['{', [':','x',1], [':','"y"',2]])
  is(parse('{x: 1+2, y:a(3)}'), ['{', [':','x',['+',1,2]], [':', 'y',['a',3]]])
  is(evaluate(parse('{x: 1+2, y:a(3)}'),{a:x=>x*2}), {x:3, y:6})
})

test('ext: justin', async t => {
  const {parse} = await import('../justin.js')
  is(parse('a;b'), [';','a','b'])
  is(parse('{x:~1, "y":2**2}["x"]'), ['.', ['{', [':','x',['~',1]], [':','"y"',['**',2,2]]], '"x"'])
  is(evaluate(parse('{x:~1, "y":2**2}["x"]')), -2)
})

test('ext: comments', t => {
  parse.space = cc => {
    while (cc = code(), cc <= 32) {
      skip()
      if (code() === 47)
        // /**/
        if (code(1) === 42) skip(2), skip(c => c !== 42 && code(1) !== 47), skip(2)
        // //
        else if (code(1) === 47) skip(2), skip(c => c >= 32)
    }
    return cc
  }
  is(parse(`a /
    // abc
    b`), ['/', 'a', 'b'])
  is(parse(`"a" + "b" // concat`),['+','"a"','"b"'])
})

test('parse: unfinished sequences', async t => {
  throws(() => parse('a+b)+c'))//, ['+','a','b'])
  throws(() => parse('(a+(b)))+c'))//, ['+','a','b'])
  throws(() => parse('a+b+)c'))//, ['+','a','b',null])
})

test('parse: non-existing operators', t => {
  throws(() => parse('a <<< b'))
  throws(() => parse('a >== b'))
  throws(() => parse('a -> b'))
})

test('parse: low-precedence unary', t => {
  parse.operator('&',13,-1)
  is(parse('&a+b*c'), ['+',['&','a'],['*','b','c']])
  is(parse('&a*b+c'), ['+',['&',['*','a','b']],'c'])
})

test('eval: edge cases', t => {
  is(evaluate(parse('Math.pow(a, 3) / 2 + b * 2 - 1'), {Math, a:1, b:1}), 1.5)
})
