import parse, { lookup, nary, binary, unary, token, skip, err, expr } from './parse.js'
import compile, { operator } from './compile.js'

const OPAREN = 40, CPAREN = 41, OBRACK = 91, CBRACK = 93, SPACE = 32, DQUOTE = 34, PERIOD = 46, _0 = 48, _9 = 57,
  PREC_SEQ = 1, PREC_SOME = 4, PREC_EVERY = 5, PREC_OR = 6, PREC_XOR = 7, PREC_AND = 8,
  PREC_EQ = 9, PREC_COMP = 10, PREC_SHIFT = 11, PREC_SUM = 12, PREC_MULT = 13, PREC_UNARY = 15, PREC_POSTFIX = 16, PREC_CALL = 18

const subscript = s => (s = parse(s), ctx => (s.call ? s : (s = compile(s)))(ctx)),

  // set any operator
  // right assoc is indicated by negative precedence (meaning go from right to left)
  set = (op, prec, fn) => (
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
  ),

  num = a => a ? err() : ['', (a = +skip(c => c === PERIOD || (c >= _0 && c <= _9) || (c === 69 || c === 101 ? 2 : 0))) != a ? err() : a],

  // create increment-assign pair from fn
  inc = (op, prec, fn, ev) => (
    token(op, prec, a => a ? [op === '++' ? '-' : '+', [op, a], ['', 1]] : [op, expr(prec - 1)]), // ++a → [++, a], a++ → [-,[++,a],1]
    operator(op, ev = (a, b) => (
      a[0] === '(' ? ev(a[1]) : // ++(((a)))
        a[0] === '.' ? (b = a[2], a = compile(a[1]), ctx => fn(a(ctx), b)) : // ++a.b
          a[0] === '[' ? ([, a, b] = a, a = compile(a), b = compile(b), ctx => fn(a(ctx), b(ctx))) : // ++a[b]
            (ctx => fn(ctx, a)) // ++a
    ))
  )


// literals
// null operator returns first value (needed for direct literals)
operator('', v => () => v)

// "a"
lookup[DQUOTE] = (a) => (a ? err() : ['', (skip() + skip(c => c - DQUOTE ? 1 : 0) + (skip() || err('Bad string'))).slice(1, -1)])

// .1
lookup[PERIOD] = a => (!a && num())

// 0-9
for (let i = 0; i <= 9; i++) lookup[_0 + i] = num

// sequences
set(',', PREC_SEQ, (...args) => args[args.length - 1])
set('||', PREC_SOME, (...args) => { let i = 0, v; for (; !v && i < args.length;) v = args[i++]; return v })
set('&&', PREC_EVERY, (...args) => { let i = 0, v = true; for (; v && i < args.length;) v = args[i++]; return v })

// binaries
set('+', PREC_SUM, (a, b) => a + b)
set('-', PREC_SUM, (a, b) => a - b)
set('*', PREC_MULT, (a, b) => a * b)
set('/', PREC_MULT, (a, b) => a / b)
set('%', PREC_MULT, (a, b) => a % b)
set('|', PREC_OR, (a, b) => a | b)
set('&', PREC_AND, (a, b) => a & b)
set('^', PREC_XOR, (a, b) => a ^ b)
set('==', PREC_EQ, (a, b) => a == b)
set('!=', PREC_EQ, (a, b) => a != b)
set('>', PREC_COMP, (a, b) => a > b)
set('>=', PREC_COMP, (a, b) => a >= b)
set('<', PREC_COMP, (a, b) => a < b)
set('<=', PREC_COMP, (a, b) => a <= b)
set('>>', PREC_SHIFT, (a, b) => a >> b)
set('>>>', PREC_SHIFT, (a, b) => a >>> b)
set('<<', PREC_SHIFT, (a, b) => a << b)

// unaries
set('+', PREC_UNARY, a => +a)
set('-', PREC_UNARY, a => -a)
set('!', PREC_UNARY, a => !a)

// increments
inc('++', PREC_UNARY, (a, b) => ++a[b])
inc('--', PREC_UNARY, (a, b) => --a[b])

// a[b]
token('[', PREC_CALL, a => a && ['[', a, expr(0, CBRACK) || err()])
operator('[', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx)[b(ctx)]))

// a.b
token('.', PREC_CALL, (a, b) => a && (b = expr(PREC_CALL)) && ['.', a, b])
operator('.', (a, b) => (a = compile(a), b = !b[0] ? b[1] : b, ctx => a(ctx)[b])) // a.true, a.1 → needs to work fine

// (a,b,c), (a)
token('(', PREC_CALL, a => !a && ['(', expr(0, CPAREN) || err()])

// a(b,c,d), a()
token('(', PREC_CALL, (a, b) => a && (b = expr(0, CPAREN), b ? ['(', a, b] : ['(', a, '']))
operator('(', (a, b, path, args) => b == null ? (compile(a, b)) : (
  args = b == '' ? () => [] : // a()
    b[0] === ',' ? (b = b.slice(1).map(compile), ctx => b.map(arg => arg(ctx))) : // a(b,c)
      (b = compile(b), ctx => [b(ctx)]), // a(b)

  a[0] === '.' ? (path = a[2], a = compile(a[1]), ctx => a(ctx)[path](...args(ctx))) : // a.b(...args)
    a[0] === '[' ? (path = compile(a[2]), a = compile(a[1]), ctx => a(ctx)[path(ctx)](...args(ctx))) : // a[b](...args)
      (a = compile(a), ctx => a(ctx)(...args(ctx))) // a(...args)
)
)

export default subscript
export { set }
export * from './parse.js'
export * from './compile.js'
