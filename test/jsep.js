import test, {is, any, throws} from '../lib/test.js'
import subscript, {parse, evaluate} from '../justin.js'
import { char, skip, space, code, expr } from '../parse.js'

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
  parse.binary['**'] = 16; // ES2016, right-associative

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

test('Custom operators', ()=> {
  parse.binary['^'] = 10;
  is(parse('a^b'), ['^','a','b']);

  parse.binary['×'] = 9;
  is(parse('a×b'), ['×','a','b']);

  parse.binary['or'] = 1;
  is(parse('oneWord or anotherWord'), ['or', 'oneWord', 'anotherWord']);
  throws(() => parse('oneWord ordering anotherWord'));

  parse.unary['#'] = 11;
  is(parse('#a'), ['#','a']);

  parse.unary['not'] = 11;
  is(parse('not a'), ['not', 'a']);

  // parse.unary['notes'] = 11;
  // is(parse('notes 1'), ['notes', 1]);
});

test('Custom alphanumeric operators', ()=> {
  parse.binary['and'] = 2;
  is(parse('a and b'),['and','a','b']);
  is(parse('bands'), 'bands');

  // FIXME: low priority - likely we force `and ` operator
  // is(parse('b ands'), []);

  parse.unary['not'] = 11
  is(parse('not a'), ['not', 'a']);
  is(parse('notes'), 'notes');
});

test.skip('Custom identifier characters', ()=> {
  // NOTE: ain't going to fix: just implement custim idents
  jsep.addIdentifierChar('@');
  testParser('@asd', {
    type: 'Identifier',
    name: '@asd',
  });
  jsep.removeIdentifierChar('@');
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
  is(parse('check(,)'), ['check', null, null]);
  is(parse('check(,1,2)'), ['check', null, 1,2]);
  is(parse('check(1,,2)'), ['check', 1,null,2]);
  is(parse('check(1,2,)'), ['check', 1,2, null]);
  throws(() => parse('check(a, b c d) '), 'spaced arg after 1 comma');
  throws(() => parse('check(a, b, c d)'), 'spaced arg at end');
  throws(() => parse('check(a b, c, d)'), 'spaced arg first');
  throws(() => parse('check(a b c, d)'), 'spaced args first');
});

test.only('Uncompleted expression-call/array', ()=> {
  throws(function () {
    parse('myFunction(a,b');
  }, 'detects unfinished expression call');

  // throws(function () {
    parse('[1,2');
  // }, 'detects unfinished array');

  throws(function () {
    parse('-1+2-');
  }, /Expected expression after - at character 5/,
  'detects trailing operator');
});

test.todo(`should throw on invalid expr "${expr}"`, (assert) => {

  throws(() => parse('!'))
  throws(() => parse('*x'))
  throws(() => parse('||x'))
  throws(() => parse('?a:b'))
  throws(() => parse('.'))
  throws(() => parse('()()'))
    // '()', should throw 'unexpected )'...
  throws(() => parse('() + 1'))
});

test.todo('Esprima Comparison', ()=> {
  ([
    '[1,,3]',
    '[1,,]', // this is actually incorrect in esprima
    ' true',
    'false ',
    ' 1.2 ',
    ' .2 ',
    'a',
    'a .b',
    'a.b. c',
    'a [b]',
    'a.b  [ c ] ',
    '$foo[ bar][ baz].other12 [\'lawl\'][12]',
    '$foo     [ 12  ] [ baz[z]    ].other12*4 + 1 ',
    '$foo[ bar][ baz]    (a, bb ,   c  )   .other12 [\'lawl\'][12]',
    '(a(b(c[!d]).e).f+\'hi\'==2) === true',
    '(1,2)',
    '(a, a + b > 2)',
    'a((1 + 2), (e > 0 ? f : g))',
    '(((1)))',
    '(Object.variable.toLowerCase()).length == 3',
    '(Object.variable.toLowerCase())  .  length == 3',
    '[1] + [2]',
    '"a"[0]',
    '[1](2)',
    '"a".length',
    'a.this',
    'a.true',
  ])
});

// Should support ternary by default (index.js):
test.todo('Ternary', ()=> {
  testParser('a ? b : c', { type: 'ConditionalExpression' });
  testParser('a||b ? c : d', { type: 'ConditionalExpression' });
});


test.todo('should allow manipulating what is considered whitespace', (assert) => {
  const expr = 'a // skip all this';
  throws(() => parse(expr));

  jsep.hooks.add('gobble-spaces', function () {
    if (this.char === '/' && this.expr.charAt(this.index + 1) === '/') {
      this.index += 2;
      while (!isNaN(this.code)) {
        this.index++;
      }
    }
  });
  testParser('a // skip all this', { type: 'Identifier' });
});

test.todo('should allow overriding gobbleToken', (assert) => {
  const expr = '...';
  throws(() => parse(expr));
  jsep.hooks.add('gobble-token', function (env) {
    if ([0, 1, 2].every(i => this.expr.charAt(i) === '.')) {
      this.index += 3;
      env.node = { type: 'spread' };
    }
  });
  testParser(expr, { type: 'spread' });
});
