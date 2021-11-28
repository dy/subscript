import test, {is, any, throws} from '../lib/test.js'
import subscript, {parse, evaluate} from '../justin.js'
import { skip, code, expr, char, nil, operator } from '../parse.js'

test('Expression: Constants', ()=> {
  is(parse('\'abc\''),  "'abc'" );
  is(parse('"abc"'),  '"abc"' );
  is(parse('123'),  123 );
  is(parse('12.3'),  12.3 );
});

test('String escapes', () => {
  is(parse("'a \\w b'"), "'a w b'")
  is(parse("'a \\' b'"), "'a ' b'")
  is(parse("'a \\n b'"), "'a \n b'")
  is(parse("'a \\r b'"), "'a \r b'")
  is(parse("'a \\t b'"), "'a \t b'")
  is(parse("'a \\b b'"), "'a \b b'")
  is(parse("'a \\f b'"), "'a \f b'")
  is(parse("'a \\v b'"), "'a \v b'")
  is(parse("'a \\\ b'"), "'a \ b'")
});

test('Variables', ()=> {
  is(parse('abc'), 'abc');
  is(parse('a.b[c[0]]'), ['.',['.', 'a' ,'"b"'], ['.', 'c', 0]]);
  is(parse('Δέλτα'), 'Δέλτα');
});
test.todo('Question operator', () => {
  is(parse('a?.b?.(arg)?.[c] ?. d'), []);
})

test('Function Calls', ()=> {
  is(parse("a(b, c(d,e), f)"), ['a', 'b', ['c','d','e'], 'f'])
  throws(t => parse('a b + c'))
  is(parse("'a'.toString()"), [['.', "'a'", '"toString"']])
  is(parse('[1].length'), ['.',['[',1],'"length"'])
  // is(parse(';'), {})
  // // allow all spaces or all commas to separate arguments
  // is(parse('check(a, b, c, d)'), {})
  throws(t => parse('check(a b c d)'))
});

test('Arrays', ()=> {
  is(parse('[]'), ['[']);
  is(parse('[a]'), ['[','a']);
});

test('Ops', function (qunit) {
  // parse.binary['**'] = 16; // ES2016, right-associative

  is(parse('1'), 1)
  is(parse('1+2'), ['+',1,2])
  is(parse('1*2'), ['*',1,2])
  is(parse('1*(2+3)'), ['*',1,['+',2,3]])
  is(parse('(1+2)*3'), ['*',['+',1,2],3])
  is(parse('(1+2)*3+4-2-5+2/2*3'), ['+',['-',['+',['*',['+',1,2],3],4],2,5],['*',['/',2,2],3]])
  is(parse('1 + 2-   3*  4 /8'), ['-',['+',1, 2], ['/',['*',3,4],8]])
  is(parse('\n1\r\n+\n2\n'), ['+',1,2])
  is(parse('1 + -2'), ['+',1,['-',2]])
  is(parse('-1 + -2 * -3 * 2'), ['+',['-',1],['*',['-',2],['-',3],2]])
  is(parse('2 ** 3 ** 4'), ['**',2,3,4])
  is(parse('2 ** 3 ** 4 * 5 ** 6 ** 7 * (8 + 9)'), ['*',['**',2,3,4],['**',5,6,7],['+',8,9]])
  is(parse('(2 ** 3) ** 4 * (5 ** 6 ** 7) * (8 + 9)'), ['*',['**',['**',2,3],4],['**',5,6,7],['+',8,9]])
});

test.only('Custom operators', ()=> {
  // is(parse('a^b'), ['^','a','b']);

  // operator('×', 9)
  // is(parse('a×b'), ['×','a','b']);

  // operator('or',1)
  // is(parse('oneWord or anotherWord'), ['or', 'oneWord', 'anotherWord']);
  // throws(() => parse('oneWord ordering anotherWord'));

  // operator('#', 11, -1)
  // is(parse('#a'), ['#','a']);

  operator('not', 13, (node) => node === 'not' && [node, expr(12)])
  is(parse('not a'), ['not', 'a']);

  throws(t => parse('notes 1'));

  operator('and', 2)
  is(parse('a and b'),['and','a','b']);
  is(parse('bands'), 'bands');

  throws(t => parse('b ands'));
});

test.skip('Bad Numbers', ()=> {
  // NOTE: for custom numbers implement custom number parser
  testParser('1.', { type: 'Literal', value: 1, raw: '1.' });
  throws(function () {
    parse('1.2.3');
  });
});

test('Missing arguments', ()=> {
  // NOTE: we accept these cases as useful
  throws(() => parse('check(,)'), ['check', null, null]);
  throws(() => parse('check(,1,2)'), ['check', null, 1,2]);
  throws(() => parse('check(1,,2)'), ['check', 1,null,2]);
  throws(() => parse('check(1,2,)'), ['check', 1,2, null]);
  throws(() => parse('check(a, b c d) '), 'spaced arg after 1 comma');
  throws(() => parse('check(a, b, c d)'), 'spaced arg at end');
  throws(() => parse('check(a b, c, d)'), 'spaced arg first');
  throws(() => parse('check(a b c, d)'), 'spaced args first');
});

test('Uncompleted expression-call/array', ()=> {
  throws(() => console.log(parse('(a,b')))
  throws(function () {
    parse('myFunction(a,b');
  }, 'detects unfinished expression call');

  throws(function () {
    parse('[1,2');
  }, 'detects unfinished array');

  throws(function () {
    parse('-1+2-');
  }, 'detects trailing operator');
});

test(`should throw on invalid expr`, () => {
  throws(() => parse('!'))
  throws(() => parse('*x'))
  throws(() => parse('||x'))
  throws(() => parse('?a:b'))
  throws(() => parse('.'))
  throws(() => parse('()()'))
    // '()', should throw 'unexpected )'...
  throws(() => console.log(parse('() + 1')))
});

test('Esprima Comparison', ()=> {
  // is(parse('[1,,3]'), [])
  // is(parse('[1,,]'), [])
  is(parse(' true'), true)
  is(parse('false '), false)
  is(parse(' 1.2 '), 1.2)
  is(parse(' .2 '), .2)
  is(parse('a'), 'a')
  is(parse('a .b'), ['.','a','"b"'])
  any(parse('a.b. c'), ['.','a','"b"','"c"'], ['.',['.','a','"b"'],'"c"'])
  is(parse('a [b]'), ['.','a','b'])
  any(parse('a.b  [ c ] '), ['.',['.','a','"b"'],'c'])
  any(parse('$foo[ bar][ baz].other12 [\'lawl\'][12]'),
    ['.','$foo','bar','baz','"other12"',"'lawl'",12],
    ['.',['.',['.',['.',['.','$foo','bar'],'baz'],'"other12"'],"'lawl'"],12]
  )
  any(parse('$foo     [ 12  ] [ baz[z]    ].other12*4 + 1 '),
    ['+',['*',['.',['.',['.','$foo',12], ['.','baz','z']],'"other12"'],4],1]
  )
  any(parse('$foo[ bar][ baz]    (a, bb ,   c  )   .other12 [\'lawl\'][12]'),
    ['.',['.',['.',[['.',['.','$foo','bar'],'baz'], 'a', 'bb', 'c'], '"other12"'],"'lawl'"],12]
  )
  is(parse('(a(b(c[!d]).e).f+\'hi\'==2) === true'),
    ['===',['==',['+',['.',['a',['.',['b',['.','c',['!','d']]],'"e"']],'"f"'],"'hi'"],2],true]
  )
  is(parse('(1,2)'), [',',1,2])
  is(parse('(a, a + b > 2)'), [',','a',['>',['+','a','b'],2]])
  is(parse('a((1 + 2), (e > 0 ? f : g))'), ['a',['+',1,2],['?:',['>','e',0],'f','g']])
  is(parse('(((1)))'), 1)
  is(parse('(Object.variable.toLowerCase()).length == 3'), ['==',['.',[['.',['.','Object','"variable"'],'"toLowerCase"']],'"length"'],3])
  is(parse('(Object.variable.toLowerCase())  .  length == 3'), ['==',['.',[['.',['.','Object','"variable"'],'"toLowerCase"']],'"length"'],3])
  is(parse('[1] + [2]'), ['+',['[',1],['[',2]])
  is(parse('"a"[0]'), ['.','"a"',0])
  is(parse('[1](2)'), [['[',1],2])
  is(parse('"a".length'), ['.','"a"','"length"'])
  is(parse('a.this'), ['.','a','"this"'])
  is(parse('a.true'), ['.','a',true])
});

// Should support ternary by default (index.js):
test('Ternary', ()=> {
  is(parse('a ? b : c'), ['?:', 'a', 'b' ,'c']);
  is(parse('a||b ? c : d'), ['?:', ['||','a','b'], 'c' ,'d']);
});


test('should allow manipulating what is considered whitespace', (assert) => {
  const expr = 'a // skip all this';
  is(parse(expr), 'a');
});

