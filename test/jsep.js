import test, {is, any, throws} from '../lib/test.js'
import subscript, {parse, evaluate} from '../justin.js'
import { char, skip, space, code, expr } from '../src/parse.js'

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
  testParser('a^b', {});

  parse.binary['×'] = 9;
  testParser('a×b', {
    type: 'BinaryExpression',
    left: { name: 'a' },
    right: { name: 'b' },
  });

  parse.binary['or'] = 1;
  testParser('oneWord ordering anotherWord', {
    type: 'Compound',
    body: [
      {
        type: 'Identifier',
        name: 'oneWord',
      },
      {
        type: 'Identifier',
        name: 'ordering',
      },
      {
        type: 'Identifier',
        name: 'anotherWord',
      },
    ],
  });

  jsep.addUnaryOp('#');
  testParser('#a', {
    type: 'UnaryExpression',
    operator: '#',
    argument: { type: 'Identifier', name: 'a' },
  });

  jsep.addUnaryOp('not');
  testParser('not a', {
    type: 'UnaryExpression',
    operator: 'not',
    argument: { type: 'Identifier', name: 'a' },
  });

  jsep.addUnaryOp('notes');
  testParser('notes', {
    type: 'Identifier',
    name: 'notes',
  });
});

test('Custom alphanumeric operators', ()=> {
  jsep.binary['and'] = 2;
  testParser('a and b', {
    type: 'BinaryExpression',
    operator: 'and',
    left: { type: 'Identifier', name: 'a' },
    right: { type: 'Identifier', name: 'b' },
  });
  testParser('bands', { type: 'Identifier', name: 'bands' });

  testParser('b ands', { type: 'Compound' });
  jsep.removeBinaryOp('and');

  jsep.addUnaryOp('not');
  testParser('not a', {
    type: 'UnaryExpression',
    operator: 'not',
    argument: { type: 'Identifier', name: 'a' },
  });
  testParser('notes', { type: 'Identifier', name: 'notes' });
  jsep.removeUnaryOp('not');
});

test('Custom identifier characters', ()=> {
  jsep.addIdentifierChar('@');
  testParser('@asd', {
    type: 'Identifier',
    name: '@asd',
  });
  jsep.removeIdentifierChar('@');
});

test('Bad Numbers', ()=> {
  testParser('1.', { type: 'Literal', value: 1, raw: '1.' });
  throws(function () {
    parse('1.2.3');
  });
});

test('Missing arguments', ()=> {
  // throws(function () {
  //   parse('check(,)');
  // }, 'detects missing argument (all)');
  // throws(function () {
  //   parse('check(,1,2)');
  // }, 'detects missing argument (head)');
  // throws(function () {
  //   parse('check(1,,2)');
  // }, 'detects missing argument (intervening)');
  // throws(function () {
  //   parse('check(1,2,)');
  // }, 'detects missing argument (tail)');
  throws(() => parse('check(a, b c d) '), 'spaced arg after 1 comma');
  throws(() => parse('check(a, b, c d)'), 'spaced arg at end');
  throws(() => parse('check(a b, c, d)'), 'spaced arg first');
  throws(() => parse('check(a b c, d)'), 'spaced args first');
});

test('Uncompleted expression-call/array', ()=> {
  throws(function () {
    parse('myFunction(a,b');
  }, 'detects unfinished expression call');

  throws(function () {
    parse('[1,2');
  }, 'detects unfinished array');

  throws(function () {
    parse('-1+2-');
  }, /Expected expression after - at character 5/,
  'detects trailing operator');
});

test(`should throw on invalid expr "${expr}"`, (assert) => {

  throws(() => parse('!'))
  throws(() => parse('*x'))
  throws(() => parse('||x'))
  throws(() => parse('?a:b'))
  throws(() => parse('.'))
  throws(() => parse('()()'))
    // '()', should throw 'unexpected )'...
  throws(() => parse('() + 1'))
});

test('Esprima Comparison', ()=> {
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
test('Ternary', ()=> {
  testParser('a ? b : c', { type: 'ConditionalExpression' });
  testParser('a||b ? c : d', { type: 'ConditionalExpression' });
});


test('should allow manipulating what is considered whitespace', (assert) => {
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

test('should allow overriding gobbleToken', (assert) => {
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
