import test, {is, any, throws} from 'tst'
import parse, { skip, isId, expr, token, err, cur, idx, lookup } from '../parse.js'


// FIXME: this part can be done via wasm
const OPAREN=40, CPAREN=41, OBRACK=91, CBRACK=93, SPACE=32, DQUOTE=34, PERIOD=46, _0=48, _9=57,
PREC_SEQ=1, PREC_SOME=4, PREC_EVERY=5, PREC_OR=6, PREC_XOR=7, PREC_AND=8,
PREC_EQ=9, PREC_COMP=10, PREC_SHIFT=11, PREC_SUM=12, PREC_MULT=13, PREC_UNARY=15, PREC_POSTFIX=16, PREC_CALL=18, PREC_GROUP=19

// numbers come built-in
for (let op=_0;op<=_9;) lookup[op++] = () => skip(c => c === PERIOD || (c <= _9 && c >= _0) || isId(c))

lookup[DQUOTE] = a => skip() + skip(c => c-DQUOTE) + skip()

const unary = (op, prec=PREC_UNARY) => token(op, a => !a && (a=expr(prec-1)) && [op, a], prec)
const binary = (op, prec=PREC_SEQ) => token(op, (a, b) => a && (b=expr(prec)) && [op,a,b], prec)
const group = (op, end) => token(op, a => !a ? [op, expr(0,end)] : [op, a, expr(0,end)], PREC_CALL)

binary('+', PREC_SUM)
binary('-', PREC_SUM)
unary('+'), unary('-'), unary('!'), unary('~')
binary('*', PREC_MULT)
binary('/', PREC_MULT)
binary('%', PREC_MULT)
binary('.', PREC_CALL)
binary(',', PREC_SEQ)
group('[', CBRACK)
group('(', CPAREN)
binary('|', PREC_OR)
binary('||',  PREC_SOME)
binary('&', PREC_AND)
binary('&&',  PREC_EVERY)
binary('^', PREC_XOR)
binary('==',  PREC_EQ)
binary('!=',  PREC_EQ)
binary('>', PREC_COMP),
binary('>=',  PREC_COMP),
binary('>>',  PREC_SHIFT),
binary('>>>',  PREC_SHIFT),
binary('<', PREC_COMP),
binary('<=',  PREC_COMP),
binary('<<',  PREC_SHIFT)


test.only('parse: basic', t => {
  is(parse('a()'), ['(', 'a', undefined])
  is(parse('1 + 2 + 3'), ['+', ['+', '1', '2'], '3'])
  is(parse('1 + 2 * 3'), ['+','1', ['*', '2', '3']])
  is(parse('1 * 2 + 3'), ['+', ['*', '1', '2'], '3'])
  is(parse('1 + 2 * 3 + 4'), ['+', ['+', '1', ['*', '2', '3']], '4'])
  is(parse(`(1+2)`), ['(',['+', '1', '2']])
  is(parse(`1+(2+3)`), ['+', '1', ['(',['+', '2', '3']]])
  is(parse(`1+(2)`), ['+', '1', ['(','2']])
  is(parse(`1+(2)+3+((4))`), ['+',['+',['+', '1', ['(','2']], '3'], ['(',['(','4']]])
  is(parse(`-2`), ['-', '2'])
  is(parse(`a ( c ) . e`), ['.',['(','a', 'c'], 'e'])
  is(parse(`a(1)`), ['(','a', '1'])
  is(parse(`a(1).b`), ['.',['(','a', '1'],'b'])
  is(parse('a[b][c]'), ['[',['[', 'a', 'b'], 'c'])
  is(parse('a.b.c'), ['.',['.','a','b'],'c'])
  is(parse('a.b.c(d).e'), ['.',['(',['.',['.','a','b'],'c'],'d'],'e'])
  is(parse(`+-2`), ['+',['-', '2']])
  is(parse(`+-a.b`), ['+',['-',['.','a','b']]])
  is(parse(`1+-2`), ['+','1',['-','2']])
  is(parse(`-a.b+1`), ['+',['-',['.','a','b']], '1'])
  is(parse(`-a-b`), ['-',['-','a'], 'b'])
  is(parse(`+-a.b+-!1`), ['+',['+',['-',['.','a','b']]], ['-',['!', '1']]])
  is(parse(`1.0`), '1.0')

  // is(parse(`   .1   +   -1.0 -  2.3e+1 `), ['-', ['+', '.1', ['-', '1']], '23'])
  is(parse(`( a,  b )`), ['(',[',','a','b']])
  is(parse(`a * 3 / 2`), ['/',['*','a','3'],'2'])
  is(parse('a(b)(c)'),['(',['(','a', 'b'],'c'])
  is(parse(`"abcd" + "efgh"`), ['+','"abcd"','"efgh"'])
  is(parse('0 + 1 + 2.0'), ['+',['+','0','1'],'2.0'])
  is(parse('0 * 1 * 2 / 1 / 2 * 1'), ['*',['/',['/',['*',['*','0','1'],'2'],'1'],'2'],'1'])

  // NOTE: these cases target tree mappers, rather than direct ops
  is(parse('a()()()'),['(',['(',['(','a', undefined], undefined], undefined])
  is(parse(`a (  ccc. d,  -+1.0 )`), ['(', 'a', [',', ['.', 'ccc', 'd'], ['-',['+','1.0']]]])
  is(parse(`(a + 2) * 3 / 2 + b * 2 - 1`), ['-',['+',['/',['*',['(',['+', 'a', '2']],'3'],'2'],['*', 'b', '2']],'1'])

  // **
  binary('**', 14)

  is(parse('1 + 2 * 3 ** 4 + 5'), ['+', ['+', '1', ['*', '2', ['**', '3', '4']]], '5'])
  is(parse(`a + b * c ** d | e`), ['|', ['+', 'a', ['*', 'b', ['**','c', 'd']]], 'e'])

  is(parse('x(a + 3)'), ['(','x',['+','a','3']])
  is(parse('1 + x(a.b + 3.5)'), ['+','1',['(','x',['+',['.','a','b'],'3.5']]])
  is(parse('a[b]'), ['[','a','b'])
  is(parse('(a(b) + 3.5)'), ['(',['+',['(','a','b'],'3.5']])
  is(parse('1 + x(a[b] + 3.5)'), ['+','1',['(','x',['+',['[','a','b'],'3.5']]])
  is(parse('x.y.z,123'), [',',['.',['.','x','y'],'z'],'123'])
  is(parse('x.y.z(123)'), ['(',['.',['.','x','y'],'z'],'123'])
  is(parse('x.y.z(123 + c[456]) + n'), ['+', ['(',['.',['.','x','y'],'z'],['+','123', ['[','c','456']]],'n'])
  is(parse('1 || 1'), ['||', '1', '1'])
  is(parse('-1%2'), ['%',['-','1'], '2'])
  is(parse('-(1%2)'), ['-',['(',['%','1', '2']]])
  is(parse('+1 * (a.b - 3.5) - "asdf" || x.y.z(123 + c[456]) + n'),
    ['||',
      ['-',['*',['+','1'],['(',['-',['.','a','b'],'3.5']]], '"asdf"'],
      ['+',['(',['.',['.','x','y'],'z'], ['+','123',['[','c','456']]],'n']
    ]
  )
})

test('parse: strings', t => {
  is(parse('"a'), 'a')
  is(parse('a + b'), ['+', 'a', 'b'])
  is(parse('"a" + "b'), ['+', 'a', 'b'])
  is(parse('"a" + ("1" + "2")'), ['+', 'a', ['+', '1', '2']])

  // parse.quote['<?']='?>'
  // is(parse('"abc" + <?js\nxyz?>'), ['+','"abc','<?js\nxyz?>'])

  // parse.quote['<--']='-->'
  // is(parse('"abc" + <--js\nxyz-->'), ['+','"abc','<--js\nxyz-->'])
})
test('ext: literals', t=> {
  const v = v => ({valueOf:()=>v})
  // parse.token.splice(2,0, c =>
  //   c === 116 && char(4) === 'true' && skip(4) ? v(true) :
  //   c === 102 && char(5) === 'false' && skip(5) ? v(false) :
  //   c === 110 && char(4) === 'null' && skip(4) ? v(null) :
  //   c === 117 && char(9) === 'undefined' && skip(9) ? v(undefined) :
  //   null
  // )
  operator('null',30,node=>!node&&(skip(4),v(null)))
  operator('false',30,node=>!node&&(skip(5),v(false)))
  operator('true',30,node=>!node&&(skip(4),v(true)))
  operator('undefined',30,node=>!node&&(skip(9),v(undefined)))

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
test.only('parse: signs', t => {
  is(parse('+-1'),['+',['-','1']])
  is(parse('a(+1)'),['(','a',['+','1']])
  is(parse('a[+1]'),['[', 'a',['+','1']])
  is(parse('a+(1)'),['+','a',['(','1']])
  is(parse('a+!1'),['+','a',['!','1']])
  is(parse('a+-1'),['+','a',['-','1']])
  // is(parse('1+-1.23e-2-1.12'),['-',['+','1',['-','1.23e-2']], '1.12'])
  is(parse('-+(1)'),['-',['+',['(','1']]])
  is(parse('+1.12-+-a+-(+1)'),['+', ['-',['+','1.12'],['+',['-','a']]],['-',['(',['+','1']]]])
  is(parse('+1.12-+-a[+1]'),['-',['+','1.12'],['+',['-',['[','a',['+','1']]]]])
  is(parse('+1-+-1'),['-',['+','1'],['+',['-','1']]])
  is(parse('-a[1]'),['-',['[','a','1']])
  is(parse('-a.b[1](2)'),['-',['(',['[',['.','a','b'],'1'],'2']])
  is(parse('+1-+-a[1]'),['-',['+','1'],['+',['-',['[','a','1']]]])
  is(parse('+1 + +2'),['+',['+','1'],['+','2']])
  is(parse('+1 + -2'),['+',['+','1'],['-','2']])
  is(parse('+1 -+2'),['-',['+','1'],['+','2']])
  is(parse('1 -2'),['-','1','2'])
  is(parse('+1 -2'),['-',['+','1'],'2'])
  is(parse('-1 +2'),['+',['-','1'],'2'])
})
test.only('parse: unaries', t => {
  is(parse('-2'),['-','2'])
  is(parse('+-2'),['+',['-','2']])
  is(parse('-+-2'),['-',['+',['-','2']]])
  is(parse('-+!2'),['-',['+',['!','2']]])
  is(parse('1-+-2'),['-','1',['+',['-','2']]])
  is(parse('1-+!2'),['-','1',['+',['!','2']]])
  is(parse('1 * -1'),['*','1',['-','1']])
})
test('parse: postfix unaries', t => {
  is(parse('2--'),['--',2])
  is(parse('2++'),['++',2])
  is(parse('1++(b)'),[['++',1],'b']) // NOTE: not supported by JS btw
})

test('parse: prop access', t => {
  is(parse('a["b"]["c"][0]'),['.',['.',['.','a','b'],'c'],0])
  is(parse('a.b.c.0'), ['.',['.',['.','a','b'],'c'],'0'])
  is(evaluate(['.','a','b',new String('c'),0], {a:{b:{c:[2]}}}), 2)
  is(evaluate(['.',['.',['.','a','b'],new String('c')],0], {a:{b:{c:[2]}}}), 2)
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
  is(parse('a.b(c,d)'),[['.','a','b'], 'c','d'])
  is(parse('a.b(c.d)'),[['.','a','b'],['.', 'c','d']])
})

test('parse: chains', t => {
  any(parse('a["b"]["c"]["d"]'),['.','a','b','c','d'], ['.',['.',['.','a','b'],'c'],'d'])
  any(parse('a.b.c.d'),['.','a','b','c','d'], ['.',['.',['.','a','b'],'c'],'d'])
  any(parse('a.b[c.d].e.f'),['.',['.',['.',['.','a','b'], ['.','c','d']],'e'],'f'],  ['.',['.',['.','a','b'],['.','c','d']],'e','f'])
  is(parse('a.b(1)(2).c'),['.',[[['.','a','b'],1],2], 'c'])
  is(parse('a.b(1)(2)'),[[['.','a','b'],1],2])
  is(parse('a()()()'),[[['a']]])
  is(parse('a.b()()'),[[['.','a','b']]])
  is(parse('(a)()()'),[['a']])
  any(parse('a.b(c.d).e.f'),['.',['.',[['.','a','b'],['.','c','d']],'e'],'f'],  ['.',[['.','a','b'],['.','c','d']],'e','f'])
  any(parse('(c.d).e'),['.',['.', 'c','d'],'e'], ['.', 'c','d','e'])
  is(parse('a.b(c.d).e(f).g()'),[['.',[['.',[['.','a','b'],['.','c','d']],'e'],'f'],'g']])
  any(parse('a.b[c.d].e'),['.',['.',['.','a','b'],['.','c','d']],'e'],   ['.',['.','a','b'],['.','c','d'],'e'])
  any(parse('a.b[c.d].e(g.h)'),[['.',['.',['.','a','b'],['.','c','d']],'e'],['.','g','h']],  [['.',['.','a','b'],['.','c','d'],'e'], ['.','g','h']])
  is(parse('a(b)(c)'),[['a','b'],'c'])
  is(parse('a(1,2)(b)'),[['a',1,2],'b'])
  is(parse('(1,2)(b)'),[[',',1,2],'b'])
  is(parse('+(1,2)(b)'),['+',[[',',1,2],'b']])
  any(parse('a[b][c]'), ['.',['.','a','b'],'c'],  ['.','a','b','c'])
  is(parse('a[1](b)["c"]'),['.', [['.','a',1],'b'],'c'])
  is(parse('a(1)[b]("c")'),[['.',['a',1],'b'],'c'])
  any(parse('a[1][b]["c"]'), ['.',['.',['.','a',1],'b'],'c'], ['.','a',1,'b','c'])
  is(parse('a(1)(b)("c")'), [[['a', 1], 'b'], 'c'])
})

test('eval: basic', t => {
  is(evaluate(['+', 1, 2]), 3)
  is(evaluate(['+', 1, ['-', 3, 2]]), 2)
  is(evaluate(['-', 5, 2, 1, 1]), 1)
  is(evaluate(['+',['-',1]]), -1)
  is(evaluate(['-',['+',1],2]), -1)

  is(evaluate('x',{x:1}), 1)
  is(evaluate(['+',1],{}), 1)

  is(evaluate(['x',1,2,3], {x(a,b,c){return a+b+c}}), 6)
})

test('ext: in operator', t => {
  evaluate.operator('in', (a,b) => a in b)
  parse.operator('in', 10, node => code(2)<=32 && [skip(2), ''+node, expr(10)])

  is(parse('inc in bin'), ['in', 'inc', 'bin'])
  is(parse('bin in inc'), ['in', 'bin', 'inc'])
  throws(() => parse('b inc'))
  is(evaluate(parse('inc in bin'), {bin:{inc:1}}), true)
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
  evaluate.operator('[', (...args) => Array(...args))
  // as operator it's faster to lookup (no need to call extra rule check) and no conflict with word ops
  operator('[', 20, (node,arg) => !node && (
    skip(), arg=expr(), skip(),
    !arg ? ['['] : arg[0] === ',' ? (arg[0]='[',arg) : ['[',arg]
  ))

  is(parse('[]'),['['])
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
  const strkey = a => Array.isArray(a) ? (a[1]=(a[1][0]===''?'':'')+a[1],a) : a
  operator('}')
  operator(':',2)
  evaluate.operator('{', (...args)=>Object.fromEntries(args))
  evaluate.operator(':', (a,b)=>[a,b])

  is(parse('{}'), ['{'])
  is(parse('{x}'), ['{','x'])
  is(parse('{x: 1}'), ['{',[':', 'x', 1]])
  is(parse('{x: 1, "y":2}'), ['{', [':','x',1], [':','y',2]])
  is(parse('{x: 1+2, y:a(3)}'), ['{', [':','x',['+',1,2]], [':', 'y',['a',3]]])
  is(evaluate(parse('{x: 1+2, y:a(3)}'),{a:x=>x*2}), {x:3, y:6})
})

test('ext: justin', async t => {
  const {parse} = await import('../justin.js')
  is(parse(`"abcd" + 'efgh'`), ['+','abcd','efgh'])
  is(parse('a;b'), [';','a','b'])
  is(parse('{x:~1, "y":2**2}["x"]'), ['.', ['{', [':','x',['~',1]], [':','y',['**',2,2]]], 'x'])
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
  is(parse(`"a" + "b" // concat`),['+','a','b'])
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
  is(evaluate(parse('pow(a, 3)'), {pow:Math.pow, a:1}), 1)
  is(evaluate(parse('Math.pow(a, 3)'), {Math, a:1}), 1)
  is(evaluate(parse('Math.pow(a, 3) / 2 + b * 2 - 1'), {Math, a:1, b:1}), 1.5)
})
