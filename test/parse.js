// Core Pratt parser tests

import test, { is, any, throws } from 'tst'
import { binary, nary, unary, token, compile, parse } from '../subscript.js'

const MULT = 120;


test('parse: basic', t => {
  parse("a==2")
  parse("a!=2")
  is(parse('a >> b'), ['>>', 'a', 'b'])
  is(parse('a || b'), ['||', 'a', 'b'])
  is(parse('a && b || c'), ['||', ['&&', 'a', 'b'], 'c'])
  is(parse('a && b || c'), ['||', ['&&', 'a', 'b'], 'c'])
  is(parse('a >> b'), ['>>', 'a', 'b'])
  is(parse('a()'), ['()', 'a', null,])
  is(parse('1 + 2 + 3'), ['+', ['+', [, 1], [, 2]], [, 3]])
  is(parse('a + b * c'), ['+', 'a', ['*', 'b', 'c']])
  is(parse('a * b + c'), ['+', ['*', 'a', 'b'], 'c'])
  is(parse('a + b * c + d'), ['+', ['+', 'a', ['*', 'b', 'c']], 'd'])
  is(parse(`(a+b)`), ['()', ['+', 'a', 'b']])
  is(parse(`a+(b+c)`), ['+', 'a', ['()', ['+', 'b', 'c']]])
  is(parse(`a+(b)`), ['+', 'a', ['()', 'b']])
  is(parse(`a+(b)+c+((d))`), ["+", ["+", ["+", "a", ["()", "b"]], "c"], ["()", ["()", "d"]]])
  is(parse(`-b`), ['-', 'b'])
  is(parse(`a ( c ) . e`), ['.', ['()', 'a', 'c'], 'e'])
  is(parse(`a(a)`), ['()', 'a', 'a'])
  is(parse(`a(a).b`), ['.', ['()', 'a', 'a'], 'b'])
  is(parse('a[b][c]'), ['[]', ['[]', 'a', 'b'], 'c'])
  is(parse('a.b.c'), ['.', ['.', 'a', 'b'], 'c'])
  is(parse('a.b.c(d).e'), ['.', ['()', ['.', ['.', 'a', 'b'], 'c'], 'd'], 'e'])
  is(parse(`+-b`), ['+', ['-', 'b']])
  is(parse(`+-a.b`), ['+', ['-', ['.', 'a', 'b']]])
  is(parse(`a+-b`), ['+', 'a', ['-', 'b']])
  is(parse(`-a.b+a`), ['+', ['-', ['.', 'a', 'b']], 'a'])
  is(parse(`-a-b`), ['-', ['-', 'a'], 'b'])
  is(parse(`+-a.b+-!a`), ['+', ['+', ['-', ['.', 'a', 'b']]], ['-', ['!', 'a']]])
  is(parse(`1.0`), [, 1])

  is(parse(`( a,  b )`), ['()', [',', 'a', 'b']])
  is(parse(`a * c / b`), ['/', ['*', 'a', 'c'], 'b'])
  is(parse('a(b)(c)'), ['()', ['()', 'a', 'b'], 'c'])
  is(parse(`"abcd" + "efgh"`), ['+', [, 'abcd'], [, 'efgh']])
  is(parse('0 + 1 + 2.0'), ['+', ['+', [, 0], [, 1]], [, 2.0]])
  is(parse('0 * 1 * 2 / 1 / 2 * 1'), ["*", ["/", ["/", ["*", ["*", ["", 0], ["", 1]], ["", 2]], ["", 1]], ["", 2]], ["", 1]])

  // NOTE: these cases target tree mappers, rather than direct ops
  is(parse('a()()()'), ['()', ['()', ['()', 'a', null,], null,], null,])
  is(parse(`a (  ccc. d,  -+1.0 )`), ['()', "a", [",", [".", "ccc", "d"], ["-", ["+", ["", 1]]]]])
  is(parse(`(a + 2) * 3 / 2 + b * 2 - 1`), ["-", ["+", ["/", ["*", ["()", ["+", "a", ["", 2]]], ["", 3]], ["", 2]], ["*", "b", ["", 2]]], ["", 1]])

  is(parse('x(a + 3)'), ['()', 'x', ['+', 'a', [, 3]]])
  is(parse('1 + x(a.b + 3.5)'), ['+', [, 1], ['()', 'x', ['+', ['.', 'a', 'b'], [, 3.5]]]])
  is(parse('a[b]'), ['[]', 'a', 'b'])
  is(parse('(a(b) + 3.5)'), ['()', ['+', ['()', 'a', 'b'], [, 3.5]]])
  is(parse('1 + x(a[b] + 3.5)'), ['+', [, 1], ['()', 'x', ['+', ['[]', 'a', 'b'], [, 3.5]]]])
  is(parse('x.y.z,123'), [',', ['.', ['.', 'x', 'y'], 'z'], [, 123]])
  is(parse('x.y.z(123)'), ['()', ['.', ['.', 'x', 'y'], 'z'], [, 123]])
  is(parse('x.y.z(123 + c[456]) + n'), ['+', ['()', ['.', ['.', 'x', 'y'], 'z'], ['+', [, 123], ['[]', 'c', [, 456]]]], 'n'])
  is(parse('1 || 1'), ['||', [, 1], [, 1]])
  is(parse('-1%2'), ['%', ['-', [, 1]], [, 2]])
  is(parse('-(1%2)'), ['-', ['()', ['%', [, 1], [, 2]]]])
  is(parse('+1 * (a.b - 3.5) - "asdf" || x.y.z(123 + c[456]) + n'),
    ['||',
      ['-', ['*', ['+', [, 1]], ['()', ['-', ['.', 'a', 'b'], [, 3.5]]]], [, 'asdf']],
      ['+', ['()', ['.', ['.', 'x', 'y'], 'z'], ['+', [, 123], ['[]', 'c', [, 456]]]], 'n']
    ]
  )
})

test('parse: default operators', t => {
  is(parse(`a.b`), ['.','a', 'b'])
  is(parse(`a[b]`), ['[]','a', 'b'])
  is(parse(`a(b)`), ['()','a', 'b'])
  is(parse(`a++`), ['++','a',null,])
  is(parse(`a--`), ['--','a',null,])
  is(parse(`++a`), ['++','a'])
  is(parse(`--a`), ['--','a'])
  is(parse(`a * b`), ['*','a', 'b'])
  is(parse(`a / b`), ['/','a', 'b'])
  is(parse(`a % b`), ['%','a', 'b'])
  is(parse(`+a`), ['+','a'])
  is(parse(`-a`), ['-','a'])
  is(parse(`a + b`), ['+','a', 'b'])
  is(parse(`a - b`), ['-','a', 'b'])
  is(parse(`a < b`), ['<','a', 'b'])
  is(parse(`a <= b`), ['<=','a', 'b'])
  is(parse(`a > b`), ['>','a', 'b'])
  is(parse(`a >= b`), ['>=','a', 'b'])
  is(parse(`a == b`), ['==','a', 'b'])
  is(parse(`a != b`), ['!=','a', 'b'])
  is(parse(`~a`), ['~','a'])
  is(parse(`a & b`), ['&','a', 'b'])
  is(parse(`a ^ b`), ['^','a', 'b'])
  is(parse(`a | b`), ['|','a', 'b'])
  is(parse(`a << b`), ['<<','a', 'b'])
  is(parse(`a >> b`), ['>>','a', 'b'])
  is(parse(`!a`), ['!','a'])
  is(parse(`a && b`), ['&&','a', 'b'])
  is(parse(`a || b`), ['||','a', 'b'])
  is(parse(`a = b`), ['=','a', 'b'])
  is(parse(`a += b`), ['+=','a', 'b'])
  is(parse(`a -= b`), ['-=','a', 'b'])
  is(parse(`a *= b`), ['*=','a', 'b'])
  is(parse(`a /= b`), ['/=','a', 'b'])
  is(parse(`a %= b`), ['%=','a', 'b'])
  is(parse(`a <<= b`), ['<<=','a', 'b'])
  is(parse(`a >>= b`), ['>>=','a', 'b'])
  is(parse(`(a(b))`), ['()',['()', 'a', 'b']])
  is(parse(`a; b;`), [';','a', 'b', null])
  is(parse(`"abc"`), [,'abc'])
  is(parse(`'abc'`), [,'abc'])
  is(parse(`0.1`), [,0.1])
  is(parse(`1.2e+3`), [,1.2e+3])

})

test('parse: strings', t => {
  throws(() => parse('"a'), 'bad string')
  is(parse('a + b'), ['+', 'a', 'b'])
  throws(() => parse('"a" + "b'), 'bad string')
  is(parse('"a" + ("1" + "2")'), ['+', [, 'a'], ['()', ['+', [, '1'], [, '2']]]])
})

test('parse: bad number', t => {
  is(parse('-1.23e-2'), ['-', [, 1.23e-2]])
  throws(t => parse('.e-1'))
})

test('parse: trailing-dot exponent (1.e3)', t => {
  // A trailing dot with no fractional digits, then an exponent, is one numeric
  // literal in JS (`1.e3 === 1000`). The lexer currently stops at `1.` (= 1) and
  // re-reads `e3` as a member access `(1).e3` → wrong value. These working forms
  // are the regression guards; the trailing-dot-exponent ones are the bug.
  is(parse('1.5e3'), [, 1500])     // fractional digits present — already correct
  is(parse('1.'), [, 1])           // trailing dot, no exponent — already correct
  is(parse('1e3'), [, 1000])       // no dot — already correct
  is(parse('1.e3'), [, 1000])      // BUG: parses as ['.', [, 1], 'e3']
  is(parse('0.e1'), [, 0])         // BUG: ['.', [, 0], 'e1']
  is(parse('0.E1'), [, 0])         // BUG: ['.', [, 0], 'E1']
  is(parse('1.e-3'), [, 1e-3])     // BUG: ['-', ['.', [, 1], 'e'], [, 3]]
  is(parse('1.e+3'), [, 1000])     // BUG: ['+', ['.', [, 1], 'e'], [, 3]]
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
  is(parse('a(+x)'), ['()', 'a', ['+', 'x']])
  is(parse('a[+x]'), ['[]', 'a', ['+', 'x']])
  is(parse('a+(x)'), ['+', 'a', ['()', 'x']])
  is(parse('a+!x'), ['+', 'a', ['!', 'x']])
  is(parse('a+-x'), ['+', 'a', ['-', 'x']])
  is(parse('-+(x)'), ['-', ['+', ['()', 'x']]])
  is(parse('+1.12-+-a+-(+x)'), ['+', ['-', ['+', [, 1.12]], ['+', ['-', 'a']]], ['-', ['()', ['+', 'x']]]])
  is(parse('+1.12-+-a[+x]'), ['-', ['+', [, 1.12]], ['+', ['-', ['[]', 'a', ['+', 'x']]]]])
  is(parse('+x-+-x'), ['-', ['+', 'x'], ['+', ['-', 'x']]])
  is(parse('-a[x]'), ['-', ['[]', 'a', 'x']])
  is(parse('-a.b[x](y)'), ['-', ['()', ['[]', ['.', 'a', 'b'], 'x'], 'y']])
  is(parse('+x-+-a[x]'), ['-', ['+', 'x'], ['+', ['-', ['[]', 'a', 'x']]]])
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

  is(parse('a--'), ['--', 'a', null])
  is(parse('a++'), ['++', 'a', null])
})

test('parse: prop access', t => {
  is(parse('a["b"]["c"][0]'), ['[]', ['[]', ['[]', 'a', [, 'b']], [, 'c']], [, 0]])
  is(parse('a.b.c.0'), ['.', ['.', ['.', 'a', 'b'], 'c'], [, 0]])
})

test('parse: parens', t => {
  is(parse('x+(b)()'), ['+', 'x', ['()', ['()', 'b'], null]])
  is(parse('(x)+-b()'), ['+', ['()', 'x'], ['-', ['()', 'b', null]]])
  is(parse('x+a(b)'), ['+', 'x', ['()', 'a', 'b']])
  is(parse('x+(b)'), ['+', 'x', ['()', 'b']])
  is(parse('x+-(b)'), ['+', 'x', ['-', ['()', 'b']]])
  is(parse('(b)'), ['()', 'b'])
  is(parse('+b'), ['+', 'b'])
  is(parse('+(b)'), ['+', ['()', 'b']])
  is(parse('+((b))'), ['+', ['()', ['()', 'b']]])
  is(parse('++(b)'), ['++', ['()', 'b']])
  throws(() => compile(parse('++a(b)')), 'prefix increment on call is invalid')
  is(parse('+(b)'), ['+', ['()', 'b']])
  is(parse('x+(b)'), ['+', 'x', ['()', 'b']])
  is(parse('(x)+-b'), ['+', ['()', 'x'], ['-', 'b']])
  is(parse('x[x]+-b'), ['+', ['[]', 'x', 'x'], ['-', 'b']])
  is(parse('x[+-x]'), ['[]', 'x', ['+', ['-', 'x']]])
  is(parse('(+-x)'), ['()', ['+', ['-', 'x']]])
  is(parse('x(+-x)'), ['()', 'x', ['+', ['-', 'x']]])
  is(parse('(x,y,z)'), ['()', [',', 'x', 'y', 'z']])
})

test('parse: functions', t => {
  is(parse('a()'), ['()', 'a', null])
  is(parse('(c,d)'), ['()', [',', 'c', 'd']])
  is(parse('a(b)(d)'), ['()', ['()', 'a', 'b'], 'd'])
  is(parse('a(b,c)(d)'), ['()', ['()', 'a', [',', 'b', 'c']], 'd'])
  is(parse('(c)(e)'), ['()', ['()', 'c'], 'e'])
  is(parse('b(c,d)'), ['()', 'b', [',', 'c', 'd']])
  is(parse('b(c)(e)'), ['()', ['()', 'b', 'c'], 'e'])
  is(parse('(c,d)(e)'), ['()', ['()', [',', 'c', 'd']], 'e'])
  is(parse('a.b(c,d)'), ['()', ['.', 'a', 'b'], [',', 'c', 'd']])
  is(parse('a.b(c.d)'), ['()', ['.', 'a', 'b'], ['.', 'c', 'd']])
})

test('parse: chains', t => {
  is(parse('a["b"]["c"]["d"]'), ["[]",["[]",["[]","a",[,"b"]],[,"c"]],[,"d"]])
  is(parse('a.b.c.d'), [".",[".",[".","a","b"],"c"],"d"])
  is(parse('a.b[c.d].e.f'), [".",[".",["[]",[".","a","b"],[".","c","d"]],"e"],"f"])
  is(parse('a.b(1)(2).c'), [".",["()",["()",[".","a","b"],[,1]],[,2]],"c"])
  is(parse('a.b(1)(2)'), ["()",["()",[".","a","b"],[,1]],[,2]])
  is(parse('a()()()'), ["()",["()",["()","a",null],null],null])
  is(parse('a.b()()'), ["()",["()",[".","a","b"],null],null])
  is(parse('(a)()()'), ["()",["()",["()","a"],null],null])
  is(parse('a.b(c.d).e.f'), [".",[".",["()",[".","a","b"],[".","c","d"]],"e"],"f"])
  is(parse('(c.d).e'), [".",["()",[".","c","d"]],"e"])
  is(parse('a.b(c.d).e(f).g()'), ["()",[".",["()",[".",["()",[".","a","b"],[".","c","d"]],"e"],"f"],"g"],null])
  is(parse('a.b[c.d].e'), [".",["[]",[".","a","b"],[".","c","d"]],"e"])
  is(parse('a.b[c.d].e(g.h)'), ["()",[".",["[]",[".","a","b"],[".","c","d"]],"e"],[".","g","h"]])
  is(parse('a(b)(c)'), ["()",["()","a","b"],"c"])
  is(parse('a(1,2)(b)'), ["()",["()","a",[",",[,1],[,2]]],"b"])
  is(parse('(1,2)(b)'), ["()",["()",[",",[,1],[,2]]],"b"])
  is(parse('+(1,2)(b)'), ["+",["()",["()",[",",[,1],[,2]]],"b"]])
  is(parse('a[b][c]'), ["[]",["[]","a","b"],"c"])
  is(parse('a[1](b)["c"]'), ["[]",["()",["[]","a",[,1]],"b"],[,"c"]])
  is(parse('a(1)[b]("c")'), ["()",["[]",["()","a",[,1]],"b"],[,"c"]])
  is(parse('a[1][b]["c"]'), ["[]",["[]",["[]","a",[,1]],"b"],[,"c"]])
  is(parse('a(1)(b)("c")'), ["()",["()",["()","a",[,1]],"b"],[,"c"]])
})

test.skip('parse: nary', t => {
  nary('#', 10, true)
  is(parse('a#b'), ['#', 'a', 'b'])
  is(parse('#a'), ['#', null, 'a'])
  is(parse('a##b#c'), ['#', 'a', null, 'b', 'c'])
  is(parse('#a###c#'), ['#', null, 'a', null, null, 'c', null,])

  is(parse('a;;'), [';', 'a', null, null,])
  is(parse(';a'), [';', null, 'a'])
  is(parse('a;b'), [';', 'a', 'b'])
  is(parse('a;b;'), [';', 'a', 'b', null,])
  is(parse('a;;b;c'), [';', 'a', null, 'b', 'c'])
  is(parse(';a;;;c;'), [';', null, 'a', null, null, 'c', null,])

  // special error case (@ isn't a registered operator)
  throws(() => parse('@a;'), /Unexpected/)
  throws(() => parse(';@b'), /Unexpected/)
  throws(() => parse('a;@b'), /Unexpected/)
})

test('parse: justin', async t => {
  const { parse } = await import('../justin.js')
  is(parse('a;b'), [';', 'a', 'b'])
  is(parse('a;b;'), [';', 'a', 'b', null,])
  is(parse('b;'), [';', 'b', null,])
  is(parse(`"abcd" + 'efgh'`), ['+', [, 'abcd'], [, 'efgh']])
  is(parse('{x:~1, "y":2**2}["x"]'), ['[]', ['{}', [',', [':', 'x', ['~', [, 1]]], [':', [, 'y'], ['**', [, 2], [, 2]]]]], [, 'x']])
  is(parse('a((1 + 2), (e > 0 ? f : g))'), ['()', 'a', [',', ['()', ['+', [, 1], [, 2]]], ['()', ['?', ['>', 'e', [, 0]], 'f', 'g']]]])
})

test('parse: unfinished sequences', async t => {
  throws(() => parse('a+b)+c'))
  throws(() => parse('(a+(b)))+c'))
  throws(() => parse('a+b+)c'))
})

test('parse: non-existing operators', t => {
  throws(() => parse('a <<< b'))
  throws(() => parse('a >== b'))
  throws(() => parse('a -> b'))
})

test('parse: error messages', t => {
  throws(() => parse('(a'), /Unclosed \( at 1:3/)
  throws(() => parse('"a'), /Bad string at 1:3/)
  throws(() => parse('a b'), /Unexpected token at 1:3/)
  throws(() => parse('a +'), /Unexpected token at 1:3/)
  throws(() => parse('((a)'), /Unclosed \( at 1:5/)
  throws(() => parse('a + (b'), /Unclosed \( at 1:7/)

  // Multiline errors show correct line:col
  throws(() => parse('a\n(b'), /at 2:3/)
  throws(() => parse('a;\n(b'), /at 2:3/)
  throws(() => parse('a;\nb;\n(c'), /at 3:3/)
})

test.skip('parse: low-precedence unary', t => {
  unary('#', MULT - 0.5)
  is(parse('#a+b*c'), ['+', ['#', 'a'], ['*', 'b', 'c']])
  is(parse('#a*b+c'), ['+', ['#', ['*', 'a', 'b']], 'c'])
})

test('parse: ternary', t => {
  is(parse('a ? b : c ? d : e'), ['?', 'a', 'b', ['?', 'c', 'd', 'e']])
  is(parse('a ? b : c ? d : e ? f : g'), ['?', 'a', 'b', ['?', 'c', 'd', ['?', 'e', 'f', 'g']]])
  is(parse('a ? b ? c : d : e'), ['?', 'a', ['?', 'b', 'c', 'd'], 'e'])
  is(parse('a ? b ? c : d : e'), ['?', 'a', ['?', 'b', 'c', 'd'], 'e'])
})
