import test, {is, any} from '../lib/test.js'
import subscript, {parse, evaluate} from '../subscript.js'
import { char, next, index, current, space, code, expr } from '../src/parse.js'

test('parse: basic', t => {
  is(parse('1 + 2 * 3'), ['+',1, ['*', 2, 3]])
  any(parse('1 + 2 + 3'), ['+', ['+', 1, 2], 3],   ['+', 1, 2, 3])
  any(parse('1 + 2 + 3 + 4'), ['+', ['+', ['+', 1, 2], 3], 4],   ['+', 1, 2, 3, 4])
  is(parse('1 * 2 + 3'), ['+', ['*', 1, 2], 3])
  any(parse('1 + 2 * 3 + 4'), ['+', ['+', 1, ['*', 2, 3]], 4],    ['+', 1, ['*', 2, 3], 4])
  is(parse(`1+(2+3)`), ['+',1, ['+',2,3]])
  is(parse(`1+(2)`), ['+',1, 2])
  any(parse(`1+(2)+3+((4))`), ['+',['+',['+',1, 2],3],4],  ['+',1, 2,3,4])
  is(parse(`+-2`), ['+',['-',2]])
  is(parse(`+-a.b`), ['+',['-',['.','a','"b"']]])
  is(parse(`1+-2`), ['+',1,['-',2]])
  is(parse(`-a.b+1`), ['+',['-',['.','a','"b"']], 1])
  is(parse(`-a-b`), ['-',['-','a'], 'b'])
  is(parse(`+-a.b+-!1`), ['+',['+',['-',['.','a','"b"']]], ['-',['!',1]]])

  is(parse(`   .1   +   -1.0 -  2.3e+1 `), ['-', ['+', .1, ['-',1]], 23])
  is(parse(`a ( c ) . e`), ['.',['a', 'c'], '"e"'])
  is(parse(`a(1)`), [['a'], 1])
  is(parse(`a(1).b`), ['.',[['a'], 1],'"b"'])

  any(parse('a[b][c]'),['.','a', 'b', 'c'], ['.',['.', 'a', 'b'], 'c'])
  any(parse('a.b.c(d).e'), ['.',[['.',['.','a','"b"'],'"c"'],'d'],'"e"'],    ['.',[['.','a','"b"','"c"'],'d'],'"e"'])
  is(parse(`( a, , b )`), [',','a',undefined,'b'])
  is(parse(`a (  ccc. d, , -+1.0 )`), ['a', ['.', 'ccc', '"d"'], null, ['-',['+',1]]])

  is(parse(`a.b (  ccc. d, , -+1.0 ) . e`), ['.',[['.', 'a', '"b"'], ['.', 'ccc', '"d"'], null, ['-',['+',1]]], '"e"'])
  is(parse(`(a + 2) * 3 / 2 + b * 2 - 1`), ['-',['+',['/',['*',['+', 'a', 2],3],2],['*', 'b', 2]],1])
  is(parse('a()()()'),[[['a']]])
  is(parse('a(b)(c)'),[['a', 'b'],'c'])

  parse.binary['**']=16

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

test.skip('parse: interpolate string', t => {
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
test.todo('parse: comments', t => {
  const RETURN = 13, NEWLINE = 10
  parse.token.unshift(() => {
    console.group('parse', index, current)
    console.log(0, char(2))
    if (char(2) === '//') next(2), console.log('found',char()), next(c => console.log(1,char())||(c !== RETURN && c !== NEWLINE)), space()
    console.log(123, char())
    console.groupEnd()
  })

  // is(parse(`a /
  //   // abc
  //   b`), ['/', 'a', 'b'])
  is(parse(`'a' + 'b' // concat`),['+',"'a'","'b'"])
})
test('parse: literals', t=> {
  is(parse('null'), null)
  is(parse('(null)'), null)
  // parse.literal['undefined'] = undefined
  // is(parse('undefined'), undefined)
  // is(parse('(undefined)'), undefined)
  is(parse('true||((false))'), ['||', true, false])
  is(parse('a(true)'), ['a', true])
  is(parse('a0'), 'a0')
  is(evaluate(parse('x(0)'),{x:v=>!!v}), false)
  is(evaluate(parse('x(true)'),{x:v=>!!v}), true)
})

test('parse: E operator', t => {
  parse.binary['x'] = 5
  is(parse('1x2'), ['x',1,2])
  is(parse('1e2'), 100)

  is(parse('-1.23e-2'),['-',1.23e-2])
  is(parse('-1.23E-2'),['-',1.23e-2])
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
  any(parse('a.b.c.0'), ['.',['.',['.','a','"b"'],'"c"'],'"0"'],  ['.', 'a', '"b"', '"c"', '"0"'])
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
  evaluate.operator['in'] = (a,b)=>a in b
  parse.postfix.unshift(node => (char(2) === 'in' ? (next(2), ['in', '"' + node + '"', expr()]) : node))

  is(parse('inc in bin'), ['in', '"inc"', 'bin'])
  is(parse('bin in inc'), ['in', '"bin"', 'inc'])
  is(evaluate(parse('inc in bin'), {bin:{inc:1}}), true)
})

test('ext: ternary', t => {
  evaluate.operator['?:']=(a,b,c)=>a?b:c
  parse.postfix.unshift(node => {
    let a, b
    if (code() !== 63) return node
    next(), space(), a = expr(58)
    if (code() !== 58) return node
    next(), space(), b = expr()
    return ['?:',node, a, b]
  })

  is(parse('a ? b : c'),['?:','a','b','c']) // ['?:', 'a', 'b', 'c']

  is(evaluate(parse('a?b:c'), {a:true,b:1,c:2}), 1)
  is(evaluate(parse('a?b:c'), {a:false,b:1,c:2}), 2)
})

test('ext: list', t => {
  evaluate.operator['['] = (...args) => Array(...args)
  parse.token.unshift((node, arg) =>
    code() === 91 ?
    (
      next(), arg=expr(93),
      node = arg==null ? ['['] : arg[0] === ',' ? (arg[0]='[',arg) : ['[',arg],
      next(), node
    ) : null
  )

  is(parse('[]'),['['])
  is(parse('[1]'),['[',1])
  is(parse('[1,,2,b]'),['[',1,undefined,2,'b'])
  is(parse('[1]+[2]'),['+',['[',1],['[',2]])
  is(evaluate(parse('[1,,2,b]'),{b:3}),[1,undefined,2,3])
})

test('ext: object', t => {
  parse.binary[':'] = 2
  parse.token.unshift((node) => code() === 123 ? (next(), node = map(['{',expr(125)]), next(), node) : null)
  evaluate.operator['{'] = (...args)=>Object.fromEntries(args)
  evaluate.operator[':'] = (a,b)=>[a,b]

  const map = (n, args) => {
    if (n[1]==null) args = []
    else if (n[1][0]==':') args = [n[1]]
    else if (n[1][0]==',') args = n[1].slice(1)
    return ['{', ...args]
  }

  is(parse('{}'), ['{'])
  is(parse('{x: 1}'), ['{',[':', 'x', 1]])
  is(parse('{x: 1, "y":2}'), ['{', [':','x',1], [':','"y"',2]])
  is(parse('{x: 1+2, y:a(3)}'), ['{', [':','x',['+',1,2]], [':', 'y',['a',3]]])
  is(evaluate(parse('{x: 1+2, y:a(3)}'),{a:x=>x*2}), {x:3, y:6})
})

test('ext: justin', async t => {
  const {parse} = await import('../justin.js')
  is(parse('{x:~1, "y":2**2}["x"]'), ['.', ['{', [':','x',['~',1]], [':','"y"',['**',2,2]]], '"x"'])
  is(evaluate(parse('{x:~1, "y":2**2}["x"]')), -2)
})

test('parse: unfinished sequences', async t => {
  is(parse('a+b)+c'), ['+','a','b'])
  is(parse('(a+(b)))+c'), ['+','a','b'])
  is(parse('a+b+)c'), ['+','a','b',null])
})

test('eval: edge cases', t => {
  is(evaluate(parse('Math.pow(a, 3) / 2 + b * 2 - 1'), {Math, a:1, b:1}), 1.5)
})