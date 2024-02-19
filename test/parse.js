// Calltree tests.
// NOTE: we have redone it so many times that it's just better be kept as is

import test, { is, any, throws } from 'tst'
import { parse, binary, nary, unary, token, skip } from '../subscript.js'
import { PREC_MULT } from '../src/const.js'

test('parse: basic', t => {
  is(parse('a()'), ['(', 'a', ,])
  // is(parse('1 + 2 + 3'), ['+', '1', '2', '3'])
  is(parse('1 + 2 + 3'), ['+', ['+', [, 1], [, 2]], [, 3]])
  is(parse('a + b * c'), ['+', 'a', ['*', 'b', 'c']])
  is(parse('a * b + c'), ['+', ['*', 'a', 'b'], 'c'])
  is(parse('a + b * c + d'), ['+', ['+', 'a', ['*', 'b', 'c']], 'd'])
  is(parse(`(a+b)`), ['()', ['+', 'a', 'b']])
  is(parse(`a+(b+c)`), ['+', 'a', ['()', ['+', 'b', 'c']]])
  is(parse(`a+(b)`), ['+', 'a', ['()', 'b']])
  is(parse(`a+(b)+c+((d))`), ["+", ["+", ["+", "a", ["()", "b"]], "c"], ["()", ["()", "d"]]])
  is(parse(`-b`), ['-', 'b'])
  is(parse(`a ( c ) . e`), ['.', ['(', 'a', 'c'], 'e'])
  is(parse(`a(a)`), ['(', 'a', 'a'])
  is(parse(`a(a).b`), ['.', ['(', 'a', 'a'], 'b'])
  is(parse('a[b][c]'), ['[', ['[', 'a', 'b'], 'c'])
  is(parse('a.b.c'), ['.', ['.', 'a', 'b'], 'c'])
  is(parse('a.b.c(d).e'), ['.', ['(', ['.', ['.', 'a', 'b'], 'c'], 'd'], 'e'])
  is(parse(`+-b`), ['+', ['-', 'b']])
  is(parse(`+-a.b`), ['+', ['-', ['.', 'a', 'b']]])
  is(parse(`a+-b`), ['+', 'a', ['-', 'b']])
  is(parse(`-a.b+a`), ['+', ['-', ['.', 'a', 'b']], 'a'])
  is(parse(`-a-b`), ['-', ['-', 'a'], 'b'])
  is(parse(`+-a.b+-!a`), ['+', ['+', ['-', ['.', 'a', 'b']]], ['-', ['!', 'a']]])
  is(parse(`1.0`), [, 1])

  // is(parse(`   .1   +   -1.0 -  2.ce+1 `), ['-', ['+', '.1', ['-', '1']], '2c'])
  is(parse(`( a,  b )`), ['()', [',', 'a', 'b']])
  is(parse(`a * c / b`), ['/', ['*', 'a', 'c'], 'b'])
  is(parse('a(b)(c)'), ['(', ['(', 'a', 'b'], 'c'])
  is(parse(`"abcd" + "efgh"`), ['+', [, 'abcd'], [, 'efgh']])
  is(parse('0 + 1 + 2.0'), ['+', ['+', [, 0], [, 1]], [, 2.0]])
  is(parse('0 * 1 * 2 / 1 / 2 * 1'), ["*", ["/", ["/", ["*", ["*", ["", 0], ["", 1]], ["", 2]], ["", 1]], ["", 2]], ["", 1]])

  // NOTE: these cases target tree mappers, rather than direct ops
  is(parse('a()()()'), ['(', ['(', ['(', 'a', ,], ,], ,])
  is(parse(`a (  ccc. d,  -+1.0 )`), ["(", "a", [",", [".", "ccc", "d"], ["-", ["+", ["", 1]]]]])
  is(parse(`(a + 2) * 3 / 2 + b * 2 - 1`), ["-", ["+", ["/", ["*", ["()", ["+", "a", ["", 2]]], ["", 3]], ["", 2]], ["*", "b", ["", 2]]], ["", 1]])

  // is(parse('1 + 2 * 3 ** 4 + 5'), ['+', '1', ['*', '2', ['**', '3', '4']], '5'])
  is(parse(`a + b * c ** d | e`), ['|', ['+', 'a', ['*', 'b', ['**', 'c', 'd']]], 'e'])

  is(parse('x(a + 3)'), ['(', 'x', ['+', 'a', [, 3]]])
  // is(parse('1 + x(a.b + 3.5)'), ['+', '1', ['(', 'x', ['+', ['.', 'a', 'b'], '3.5']]])
  is(parse('a[b]'), ['[', 'a', 'b'])
  // is(parse('(a(b) + 3.5)'), ['(', ['+', ['(', 'a', 'b'], '3.5']])
  // is(parse('1 + x(a[b] + 3.5)'), ['+', '1', ['(', 'x', ['+', ['[', 'a', 'b'], '3.5']]])
  // is(parse('x.y.z,123'), [',', ['.', ['.', 'x', 'y'], 'z'], '123'])
  // is(parse('x.y.z(123)'), ['(', ['.', ['.', 'x', 'y'], 'z'], '123'])
  // is(parse('x.y.z(123 + c[456]) + n'), ['+', ['(', ['.', ['.', 'x', 'y'], 'z'], ['+', '123', ['[', 'c', '456']]], 'n'])
  // is(parse('1 || 1'), ['||', '1', '1'])
  // is(parse('-1%2'), ['%', ['-', '1'], '2'])
  // is(parse('-(1%2)'), ['-', ['(', ['%', '1', '2']]])
  // is(parse('+1 * (a.b - 3.5) - "asdf" || x.y.z(123 + c[456]) + n'),
  //   ['||',
  //     ['-', ['*', ['+', '1'], ['(', ['-', ['.', 'a', 'b'], '3.5']]], '"asdf"'],
  //     ['+', ['(', ['.', ['.', 'x', 'y'], 'z'], ['+', '123', ['[', 'c', '456']]], 'n']
  //   ]
  // )
})

test('parse: strings', t => {
  throws(() => parse('"a'), 'bad string')
  is(parse('a + b'), ['+', 'a', 'b'])
  throws(() => parse('"a" + "b'), 'bad string')
  is(parse('"a" + ("1" + "2")'), ['+', [, 'a'], ['()', ['+', [, '1'], [, '2']]]])

  // parse.quote['<?']='?>'
  // is(parse('"abc" + <?js\nxyz?>'), ['+','"abc','<?js\nxyz?>'])

  // parse.quote['<--']='-->'
  // is(parse('"abc" + <--js\nxyz-->'), ['+','"abc','<--js\nxyz-->'])
})

test('parse: bad number', t => {
  is(parse('-1.23e-2'), ['-', [, 1.23e-2]])
  throws(t => parse('.e-1'))
})

test('parse: intersecting binary', t => {
  is(parse('a | b'), ['|', 'a', 'b'], 'a|b')
  is(parse('a || b'), ['||', 'a', 'b'], 'a||b')
  is(parse('a & b'), ['&', 'a', 'b'], 'a&b')
  is(parse('a && b'), ['&&', 'a', 'b'], 'a&&b')

  is(parse('a >> b'), ['>>', 'a', 'b'], 'a>>b')
})
test('parse: signs', t => {
  is(parse('+-x'), ['+', ['-', 'x']])
  is(parse('a(+x)'), ['(', 'a', ['+', 'x']])
  is(parse('a[+x]'), ['[', 'a', ['+', 'x']])
  is(parse('a+(x)'), ['+', 'a', ['()', 'x']])
  is(parse('a+!x'), ['+', 'a', ['!', 'x']])
  is(parse('a+-x'), ['+', 'a', ['-', 'x']])
  // is(parse('1+-1.23e-2-1.12'),['-',['+','1',['-','1.23e-2']], '1.12'])
  is(parse('-+(x)'), ['-', ['+', ['()', 'x']]])
  is(parse('+1.12-+-a+-(+x)'), ['+', ['-', ['+', [, 1.12]], ['+', ['-', 'a']]], ['-', ['()', ['+', 'x']]]])
  is(parse('+1.12-+-a[+x]'), ['-', ['+', [, 1.12]], ['+', ['-', ['[', 'a', ['+', 'x']]]]])
  is(parse('+x-+-x'), ['-', ['+', 'x'], ['+', ['-', 'x']]])
  is(parse('-a[x]'), ['-', ['[', 'a', 'x']])
  is(parse('-a.b[x](y)'), ['-', ['(', ['[', ['.', 'a', 'b'], 'x'], 'y']])
  is(parse('+x-+-a[x]'), ['-', ['+', 'x'], ['+', ['-', ['[', 'a', 'x']]]])
  is(parse('+x + +y'), ['+', ['+', 'x'], ['+', 'y']])
  is(parse('+x + -y'), ['+', ['+', 'x'], ['-', 'y']])
  is(parse('+x -+y'), ['-', ['+', 'x'], ['+', 'y']])
  is(parse('x -y'), ['-', 'x', 'y'])
  is(parse('+x -y'), ['-', ['+', 'x'], 'y'])
  is(parse('-x +y'), ['+', ['-', 'x'], 'y'])
})
test('parse: unaries', t => {
  is(parse('-b'), ['-', 'b'])
  is(parse('+-b'), ['+', ['-', 'b']])
  is(parse('-+-b'), ['-', ['+', ['-', 'b']]])
  is(parse('-+!b'), ['-', ['+', ['!', 'b']]])
  is(parse('a-+-b'), ['-', 'a', ['+', ['-', 'b']]])
  is(parse('a-+!b'), ['-', 'a', ['+', ['!', 'b']]])
  is(parse('a * -a'), ['*', 'a', ['-', 'a']])

  is(parse('a--'), ['--+', 'a'])
  is(parse('a++'), ['++-', 'a'])
})

test('parse: prop access', t => {
  is(parse('a["b"]["c"][0]'), ['[', ['[', ['[', 'a', [, 'b']], [, 'c']], [, 0]])
  is(parse('a.b.c.0'), ['.', ['.', ['.', 'a', 'b'], 'c'], [, 0]])
  // is(evaluate(['.','a','b',new String('c'),0], {a:{b:{c:[2]}}}), 2)
  // is(evaluate(['.',['.',['.','a','b'],new String('c')],0], {a:{b:{c:[2]}}}), 2)
})

test('parse: parens', t => {
  is(parse('x+(b)()'), ['+', 'x', ['(', ['()', 'b'], undefined]])
  is(parse('(x)+-b()'), ['+', ['()', 'x'], ['-', ['(', 'b', undefined]]])
  is(parse('x+a(b)'), ['+', 'x', ['(', 'a', 'b']])
  is(parse('x+(b)'), ['+', 'x', ['()', 'b']])
  is(parse('x+-(b)'), ['+', 'x', ['-', ['()', 'b']]])
  is(parse('(b)'), ['()', 'b'])
  is(parse('+b'), ['+', 'b'])
  is(parse('+(b)'), ['+', ['()', 'b']])
  is(parse('+((b))'), ['+', ['()', ['()', 'b']]])
  is(parse('++(b)'), ['++', ['()', 'b']])
  is(parse('++a(b)'), ['++', ['(', 'a', 'b']])
  is(parse('+(b)'), ['+', ['()', 'b']])
  is(parse('x+(b)'), ['+', 'x', ['()', 'b']])
  is(parse('(x)+-b'), ['+', ['()', 'x'], ['-', 'b']])
  is(parse('x[x]+-b'), ['+', ['[', 'x', 'x'], ['-', 'b']])
  is(parse('x[+-x]'), ['[', 'x', ['+', ['-', 'x']]])
  is(parse('(+-x)'), ['()', ['+', ['-', 'x']]])
  is(parse('x(+-x)'), ['(', 'x', ['+', ['-', 'x']]])
  is(parse('(x,y,z)'), ['()', [',', 'x', 'y', 'z']])
})

test('parse: functions', t => {
  is(parse('a()'), ['(', 'a', undefined])
  is(parse('(c,d)'), ['()', [',', 'c', 'd']])
  is(parse('a(b)(d)'), ['(', ['(', 'a', 'b'], 'd'])
  is(parse('a(b,c)(d)'), ['(', ['(', 'a', [',', 'b', 'c']], 'd'])
  is(parse('(c)(e)'), ['(', ['()', 'c'], 'e'])
  is(parse('b(c,d)'), ['(', 'b', [',', 'c', 'd']])
  is(parse('b(c)(e)'), ['(', ['(', 'b', 'c'], 'e'])
  is(parse('(c,d)(e)'), ['(', ['()', [',', 'c', 'd']], 'e'])
  is(parse('a.b(c,d)'), ['(', ['.', 'a', 'b'], [',', 'c', 'd']])
  is(parse('a.b(c.d)'), ['(', ['.', 'a', 'b'], ['.', 'c', 'd']])
})

test.todo('parse: chains', t => {
  any(parse('a["b"]["c"]["d"]'), ['[', 'a', 'b', 'c', 'd'], ['.', ['.', ['.', 'a', 'b'], 'c'], 'd'])
  any(parse('a.b.c.d'), ['.', 'a', 'b', 'c', 'd'], ['.', ['.', ['.', 'a', 'b'], 'c'], 'd'])
  any(parse('a.b[c.d].e.f'), ['.', ['.', ['.', ['.', 'a', 'b'], ['.', 'c', 'd']], 'e'], 'f'], ['.', ['.', ['.', 'a', 'b'], ['.', 'c', 'd']], 'e', 'f'])
  is(parse('a.b(1)(2).c'), ['.', [[['.', 'a', 'b'], 1], 2], 'c'])
  is(parse('a.b(1)(2)'), [[['.', 'a', 'b'], 1], 2])
  is(parse('a()()()'), [[['a']]])
  is(parse('a.b()()'), [[['.', 'a', 'b']]])
  is(parse('(a)()()'), [['a']])
  any(parse('a.b(c.d).e.f'), ['.', ['.', [['.', 'a', 'b'], ['.', 'c', 'd']], 'e'], 'f'], ['.', [['.', 'a', 'b'], ['.', 'c', 'd']], 'e', 'f'])
  any(parse('(c.d).e'), ['.', ['.', 'c', 'd'], 'e'], ['.', 'c', 'd', 'e'])
  is(parse('a.b(c.d).e(f).g()'), [['.', [['.', [['.', 'a', 'b'], ['.', 'c', 'd']], 'e'], 'f'], 'g']])
  any(parse('a.b[c.d].e'), ['.', ['.', ['.', 'a', 'b'], ['.', 'c', 'd']], 'e'], ['.', ['.', 'a', 'b'], ['.', 'c', 'd'], 'e'])
  any(parse('a.b[c.d].e(g.h)'), [['.', ['.', ['.', 'a', 'b'], ['.', 'c', 'd']], 'e'], ['.', 'g', 'h']], [['.', ['.', 'a', 'b'], ['.', 'c', 'd'], 'e'], ['.', 'g', 'h']])
  is(parse('a(b)(c)'), [['a', 'b'], 'c'])
  is(parse('a(1,2)(b)'), [['a', 1, 2], 'b'])
  is(parse('(1,2)(b)'), [[',', 1, 2], 'b'])
  is(parse('+(1,2)(b)'), ['+', [[',', 1, 2], 'b']])
  any(parse('a[b][c]'), ['.', ['.', 'a', 'b'], 'c'], ['.', 'a', 'b', 'c'])
  is(parse('a[1](b)["c"]'), ['.', [['.', 'a', 1], 'b'], 'c'])
  is(parse('a(1)[b]("c")'), [['.', ['a', 1], 'b'], 'c'])
  any(parse('a[1][b]["c"]'), ['.', ['.', ['.', 'a', 1], 'b'], 'c'], ['.', 'a', 1, 'b', 'c'])
  is(parse('a(1)(b)("c")'), [[['a', 1], 'b'], 'c'])
})

test.skip('parse: nary', t => {
  nary('#', 10, true)
  is(parse('a#b'), ['#', 'a', 'b'])
  is(parse('#a'), ['#', , 'a'])
  is(parse('a##b#c'), ['#', 'a', , 'b', 'c'])
  is(parse('#a###c#'), ['#', , 'a', , , 'c', ,])
})

test('ext: in operator', async t => {
  await import('../feature/in.js')

  is(parse('inc in bin'), ['in', 'inc', 'bin'])
  is(parse('bin in inc'), ['in', 'bin', 'inc'])
  throws(() => parse('b inc'))
})

test('ext: justin', async t => {
  const { parse } = await import('../justin.js')
  is(parse('a;b'), [';', 'a', 'b'])
  is(parse('a;b;'), [';', 'a', 'b', ,])
  is(parse('b;'), [';', 'b', ,])
  is(parse(`"abcd" + 'efgh'`), ['+', [, 'abcd'], [, 'efgh']])
  is(parse('{x:~1, "y":2**2}["x"]'), ['[', ['{}', [',', [':', 'x', ['~', [, 1]]], [':', [, 'y'], ['**', [, 2], [, 2]]]]], [, 'x']])
  is(parse('a((1 + 2), (e > 0 ? f : g))'), ['(', 'a', [',', ['()', ['+', [, 1], [, 2]]], ['()', ['?', ['>', 'e', [, 0]], 'f', 'g']]]])
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
  unary('&', PREC_MULT - 0.5)
  is(parse('&a+b*c'), ['+', ['&', 'a'], ['*', 'b', 'c']])
  is(parse('&a*b+c'), ['+', ['&', ['*', 'a', 'b']], 'c'])
})
