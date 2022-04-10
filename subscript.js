import parse, { skip, err, expr } from './parse.js'
import compile from './compile.js'

const OPAREN=40, CPAREN=41, OBRACK=91, CBRACK=93, SPACE=32, DQUOTE=34, PERIOD=46, _0=48, _9=57,
PREC_SEQ=1, PREC_SOME=4, PREC_EVERY=5, PREC_OR=6, PREC_XOR=7, PREC_AND=8,
PREC_EQ=9, PREC_COMP=10, PREC_SHIFT=11, PREC_SUM=12, PREC_MULT=13, PREC_UNARY=15, PREC_POSTFIX=16, PREC_CALL=18

const subscript = s => (s=parse(s), ctx => (s.call?s:(s=compile(s)))(ctx))

// null operator returns first value (needed for direct literals)
compile.operator('', v => () => v)

// "abc"
parse.lookup[DQUOTE] = (a, s) => a ? err() : ['', (skip(), s=skip(c => c - DQUOTE ? 1 : 0), (skip()||err('Bad string')), s)]

// .1, 0-9
const num = a => a ? err() : ['', (a=+skip(c => c === PERIOD || (c>=_0 && c<=_9) || (c===69||c===101?2:0)))!=a?err():a]
parse.lookup[PERIOD] = a=>!a && num() // .1
for (let i = _0; i <= _9; i++) parse.lookup[i] = num // 0-9

// sequences
export const nary = (op, prec, ev) => (parse.nary(op, prec), compile.nary(op, ev))
nary(',', PREC_SEQ, (...args) => args[args.length-1])
nary('||', PREC_SOME, (...args) => { let i=0, v; for (;!v && i < args.length;) v = args[i++]; return v })
nary('&&', PREC_EVERY, (...args) => { let i=0, v=1; for (;v && i < args.length;) v = args[i++]; return v })

// binaries
export const binary = (op, prec, ev) => (parse.binary(op, Math.abs(prec), prec<0), compile.binary(op, ev))
binary('+', PREC_SUM, (a,b)=>a+b)
binary('-', PREC_SUM, (a,b)=>a-b)
binary('*', PREC_MULT, (a,b)=>a*b)
binary('/', PREC_MULT, (a,b)=>a/b)
binary('%', PREC_MULT, (a,b)=>a%b)
binary('|', PREC_OR, (a,b)=>a|b)
binary('&', PREC_AND, (a,b)=>a&b)
binary('^', PREC_XOR, (a,b)=>a^b)
binary('==', PREC_EQ, (a,b)=>a==b)
binary('!=', PREC_EQ, (a,b)=>a!=b)
binary('>', PREC_COMP, (a,b)=>a>b)
binary('>=', PREC_COMP, (a,b)=>a>=b)
binary('<', PREC_COMP, (a,b)=>a<b)
binary('<=', PREC_COMP, (a,b)=>a<=b)
binary('>>', PREC_SHIFT, (a,b)=>a>>b)
binary('>>>', PREC_SHIFT, (a,b)=>a>>>b)
binary('<<', PREC_SHIFT, (a,b)=>a<<b)

// unaries
export const unary = (op, prec, ev) => (parse.unary(op, prec), compile.unary(op, ev))
unary('+', PREC_UNARY, a => +a)
unary('-', PREC_UNARY, a => -a)
unary('!', PREC_UNARY, a => !a)

// increments
const inc = (fn,ev) => ev = (a,b) => (
  a[0] === '(' ? ev(a[1]) : // ++(((a)))
  a[0] === '.' ? (b=a[2], a=compile(a[1]), ctx => fn(a(ctx), b)) : // ++a.b
  a[0] === '[' ? ([,a,b]=a, a=compile(a),b=compile(b), ctx => fn(a(ctx),b(ctx))) : // ++a[b]
  (ctx => fn(ctx,a)) // ++a
)
parse.unary('++', PREC_UNARY), compile.operator('++', inc((a,b)=>++a[b]))
parse.unary('--', PREC_UNARY), compile.operator('--', inc((a,b)=>--a[b]))

// ++a → [++, a], a++ → [-,[++,a],1]
parse.token('++', PREC_UNARY, a => a && ['-',['++',a],['',1]])
parse.token('--', PREC_UNARY, a => a && ['+',['--',a],['',1]])

// a[b]
export const token = (tok, prec, parseFn, evalFn) => (parse.token(tok, prec, parseFn), compile.operator(tok, evalFn))
token('[', PREC_CALL,
  a => a && ['[', a, expr(0,CBRACK)||err()],
  (a,b) => b && (a=compile(a), b=compile(b), ctx => a(ctx)[b(ctx)])
)

// a.b
token('.', PREC_CALL,
  (a,b) => a && (b=expr(PREC_CALL)) && ['.',a,b],
  (a,b) => (a=compile(a),b=!b[0]?b[1]:b, ctx => a(ctx)[b])
) // a.true, a.1 → needs to work fine

// (a,b,c), (a)
token('(', PREC_CALL,
  a => !a && ['(', expr(0,CPAREN)||err()],
  (...args) => compile(...args)
)

// a(b,c,d), a()
token('(', PREC_CALL,
  a => a && ['(', a, expr(0,CPAREN)||''],
  (a,b,path,args) => b!=null && (
    args = b=='' ? () => [] : // a()
    b[0] === ',' ? (b=b.slice(1).map(compile), ctx => b.map(a=>a(ctx))) : // a(b,c)
    (b=compile(b), ctx => [b(ctx)]), // a(b)

    a[0] === '.' ? (path=a[2], a=compile(a[1]), ctx => a(ctx)[path](...args(ctx))) : // a.b(...args)
    a[0] === '[' ? (path=compile(a[2]), a=compile(a[1]), ctx => a(ctx)[path(ctx)](...args(ctx))) : // a[b](...args)
    (a=compile(a), ctx => a(ctx)(...args(ctx))) // a(...args)
  )
)

export default subscript
export {compile, parse}
