// tests cover all jsep ones + extra
import test, { is, throws } from 'tst'
import justin, { parse, nary, binary, unary, compile, operator } from '../justin.js'

// set any operator
// right assoc is indicated by negative precedence (meaning go from right to left)
export const set = (op, prec, fn) => (
  !fn.length ? (
    nary(op, Math.abs(prec), prec < 0),
    operator(op, (...args) => (args = args.map(compile), ctx => fn(...args.map(arg => arg(ctx)))))
  ) :
    fn.length > 1 ? (
      binary(op, Math.abs(prec), prec < 0),
      operator(op,
        (a, b) => b && (a = compile(a), b = compile(b), !a.length && !b.length ? (a = fn(a(), b()), () => a) : ctx => fn(a(ctx), b(ctx)))
      )
    ) :
      (
        unary(op, prec),
        operator(op, (a, b) => !b && (a = compile(a), !a.length ? (a = fn(a()), () => a) : ctx => fn(a(ctx))))
      )
)

test('Expression: Constants', () => {
  is(justin('\'abc\'')(), "abc")
  is(justin('"abc"')(), 'abc')
  is(justin('123')(), 123)
  is(justin('12.3')(), 12.3)
})

test('String escapes', () => {
  is(justin("'a \\w b'")(), "a w b")
  is(justin("'a \\' b'")(), "a ' b")
  is(justin("'a \\n b'")(), "a \n b")
  is(justin("'a \\r b'")(), "a \r b")
  is(justin("'a \\t b'")(), "a \t b")
  is(justin("'a \\b b'")(), "a \b b")
  is(justin("'a \\f b'")(), "a \f b")
  is(justin("'a \\v b'")(), "a \v b")
  is(justin("'a \\\ b'")(), "a \ b")
})

test('Variables', () => {
  is(justin('abc')({ abc: 123 }), 123)
  is(justin('a.b[c[0]]')({ a: { b: [1] }, c: [0] }), 1)
  is(justin('Δέλτα')({ Δέλτα: 123 }), 123)
})
test('Question operator', () => {
  is(justin('a?.b')({ a: { b: 1 } }), 1)
  is(justin('a?.b')({ a: 2 }), undefined)
  is(justin('a?.[1]')({ a: [, 1] }), 1)
  is(justin('a?. [1]')({ a: [, 1] }), 1)
  is(justin('a?.[1]')({}), undefined)
  is(justin('a?.(1)')({ a: v => v }), 1)
  is(justin('a?. (1)')({ a: v => v }), 1)
  is(justin('a?.(1,2)')({ a: (v, w) => v + w }), 3)
  is(justin('a?.()')({ a: v => 1 }), 1)
  is(justin('a?.(1)')({}), undefined)
  is(justin('a?.b?.(arg)?.[c] ?. d')({ a: { b: d => [, , { d }] }, arg: 1, c: 2 }), 1)
})

test('Function Calls', () => {
  is(justin("a(b, c(d,e), f)")({ a: (b, c, f) => b + c + f, b: 1, c: (d, e) => d + e, f: 2, d: 3, e: 4 }), 10)
  throws(t => justin('a b + c'))
  is(justin("'a'.toString()")(), 'a')
  is(justin('[1].length')(), 1)
  is(justin('1;2;3')(), 3)
  is(justin('1;;')(), undefined)
  // // allow all spaces or all commas to separate arguments
  // is(justin('check(a, b, c, d)'), {})
  throws(t => justin('check(a b c d)'))
})

test('Arrays', () => {
  is(justin('[]')(), [])
  is(justin('[a]')({ a: 1 }), [1])
})

test('Ops', function (qunit) {
  is(justin('1')(), 1)
  is(justin('1+2')(), 3)
  is(justin('1*2')(), 2)
  is(justin('1*(2+3)')(), 5)
  is(justin('(1+2)*3')(), 9)
  is(justin('(1+2)*3+4-2-5+2/2*3')(), 9)
  is(justin('1 + 2-   3*  4 /8')(), 1.5)
  is(justin('\n1\r\n+\n2\n')(), 3)
  is(justin('1 + -2')(), -1)
  is(justin('-1 + -2 * -3 * 2')(), 11)
  is(justin('2 ** 3 ** 2')(), 512)
  is(justin('2 * (8 + 9)')(), 2 * (8 + 9))
  is(justin('2 ** 3 ** 4 * 5 ** 6 ** 7 * (8 + 9)')(), 2 ** 3 ** 4 * 5 ** 6 ** 7 * (8 + 9))
  is(justin('(2 ** 3) ** 4 * (5 ** 6 ** 7) * (8 + 9)')(), (2 ** 3) ** 4 * (5 ** 6 ** 7) * (8 + 9))
})

test('Custom operators', () => {
  is(justin('a^b')({ a: 0xaaa, b: 0xbbb }), 0xaaa ^ 0xbbb)

  set('×', 9, (a, b) => a * b)
  is(justin('a×b')({ a: 2, b: 3 }), 6)

  set('or', 1, (a, b) => a || b)
  is(justin('oneWord or anotherWord')({ oneWord: 1, anotherWord: 0 }), 1)
  throws(() => justin('oneWord ordering anotherWord'))

  set('#', 11, (a) => [a])
  is(justin('#a')({ a: 1 }), [1])

  set('not', 13, (a) => !a)
  is(justin('not a')({ a: false }), true)

  throws(t => justin('notes 1'))

  set('and', 2, (a, b) => a && b)
  is(justin('a and b')({ a: 1, b: 2 }), 2)
  is(justin('bands')({ a: 1, b: 2 }), undefined)

  throws(t => justin('b ands'))
})

test('Bad Numbers', () => {
  // NOTE: for custom numbers implement custom number parser
  is(justin('1.')(), 1)
  // throws(() => justin('1.2.3')())
})

test('Missing arguments', () => {
  // NOTE: these cases don't matter as much, can be either for or against
  throws(() => is(justin('check(,)'), ['check', null, null]))
  throws(() => is(justin('check(,1,2)'), ['check', null, 1, 2]))
  throws(() => is(justin('check(1,,2)'), ['check', 1, null, 2]))
  throws(() => is(justin('check(1,2,)'), ['check', 1, 2, null]))
  throws(() => justin('check(a, b c d) '), 'spaced arg after 1 comma')
  throws(() => justin('check(a, b, c d)'), 'spaced arg at end')
  throws(() => justin('check(a b, c, d)'), 'spaced arg first')
  throws(() => justin('check(a b c, d)'), 'spaced args first')
})

test('Uncompleted expression-call/array', () => {
  throws(() => console.log(justin('(a,b')))
  throws(() => console.log(justin('myFunction(a,b')), 'detects unfinished expression call')

  throws(() => justin('[1,2'), 'detects unfinished array')

  throws(() => justin('-1+2-'), 'detects trailing operator')
})

test(`should throw on invalid expr`, () => {
  throws(() => console.log(justin('!')))
  throws(() => console.log(justin('*x')))
  throws(() => console.log(justin('||x')))
  throws(() => console.log(justin('?a:b')))
  throws(() => console.log(justin('.')))
  throws(() => console.log(justin('()()')))
  // '()', should throw 'unexpected )'...
  throws(() => console.log(justin('() + 1')))
})

test('Esprima Comparison', () => {
  // is(justin('[1,,3]'), [1,null,3])
  // is(justin('[1,,]'), [])

  is(justin(' true')(), true)
  is(justin('false ')(), false)
  is(justin(' 1.2 ')(), 1.2)
  is(justin(' .2 ')(), .2)
  is(justin('a')({ a: 'a' }), 'a')
  is(justin('a .b')({ a: { b: 1 } }), 1)
  is(justin('a.b. c')({ a: { b: { c: 1 } } }), 1)
  is(justin('a [b]')({ a: { b: 1 }, b: 'b' }), 1)
  is(justin('a.b  [ c ] ')({ a: { b: [, 1] }, c: 1 }), 1)
  is(justin('$foo[ bar][ baz].other12 [\'lawl\'][12]')({ $foo: [[, { other12: { lawl: { 12: 'abc' } } }]], bar: 0, baz: 1 }), 'abc')
  is(justin('$foo     [ 12  ] [ baz[z]    ].other12*4 + 1 ')({ $foo: { 12: [, { other12: 2 }] }, baz: [, 1], z: 1 }), 9)
  is(justin('$foo[ bar][ baz]    (a, bb ,   c  )   .other12 [\'lawl\'][12]')({ $foo: [[, (a, b, c) => ({ other12: { lawl: { 12: a + b + c } } })]], a: 1, bb: 2, c: 3, bar: 0, baz: 1 }), 6)
  is(justin('(a(b(c[!d]).e).f+\'hi\'==2) === true')({ a: _ => ({ f: 2 }), b: _ => ({ e: 1 }), c: { false: 0 }, d: 1 }), false)
  is(justin('(1,2)')(), 2)
  is(justin('(a, a + b > 2)')({ a: 1, b: 2 }), true)
  is(justin('a((1 + 2), (e > 0 ? f : g))')({ a: (v, w) => v + w, e: 1, f: 2, g: 3 }), 5)
  is(justin('(((1)))')(), 1)
  is(justin('(Object.variable.toLowerCase()).length == 3')({ Object: { variable: { toLowerCase: () => ({ length: 3 }) } } }), true)
  is(justin('(Object.variable.toLowerCase())  .  length == 3')({ Object: { variable: { toLowerCase: () => ({ length: 3 }) } } }), true)
  is(justin('"a"[0]')(), 'a')
  is(justin('"a".length')(), 1)
  is(justin('a.this')({ a: { this: 2 } }), 2)
  is(justin('a.true')({ a: { true: 1 } }), 1)
  is(justin('[1] + [2]')(), '12')
  is(justin('a[1](2)')({ a: [, x => x] }), 2)
})

test('Ternary', () => {
  is(justin('a ? b : c')({ a: 1, b: 2, c: 3 }), 2)
  is(justin('a||b ? c : d')({ a: 0, b: 0, c: 2, d: 3 }), 3)
})


test('comment case', () => {
  const expr = 'a // skip all this'
  is(justin(expr)({ a: 'a' }), 'a')
})

test('identities', t => {
  is(justin(`a !== b`)({ a: 1, b: 2 }), true)
  is(justin(`a === b`)({ a: 1, b: '1' }), false)
  justin(`i.value.text !== item.value.text`)
})
