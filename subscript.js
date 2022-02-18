import parse, { lookup, skip, cur, idx, err, expr, isId, space } from './parse.js'
import compile, { operator } from './compile.js'

const OPAREN=40, CPAREN=41, OBRACK=91, CBRACK=93, SPACE=32, DQUOTE=34, PERIOD=46, _0=48, _9=57,
PREC_SEQ=1, PREC_SOME=4, PREC_EVERY=5, PREC_OR=6, PREC_XOR=7, PREC_AND=8,
PREC_EQ=9, PREC_COMP=10, PREC_SHIFT=11, PREC_SUM=12, PREC_MULT=13, PREC_UNARY=15, PREC_POSTFIX=16, PREC_CALL=18

const subscript = s => (s=s.trim(), s ? (s=parse(s.trim()), ctx => (s.call?s:(s=compile(s)))(ctx)) : ()=>{}),

// set any operator
// FIXME: make right part of precedence?
set = subscript.set = (op, prec, fn, right=0, arity=fn.length, parseFn, evalFn) => (
  parseFn = fn[0] || (
    !arity ? (a, b) => a && (b=expr(prec)) && (a[0] === op && a[2] ? (a.push(b), a) : [op,a,b]) :
    arity > 1 ? (a, b) => a && (b=expr(prec-right)) && [op,a,b] :
    a => !a && (a=expr(prec-1)) && [op, a]
  ),
  evalFn = fn[1] || (
    !arity ? (...args) => (args=args.map(compile), ctx => fn(...args.map(arg=>arg(ctx)))) :
    arity > 1 ? (a,b) => b && (a=compile(a),b=compile(b), !a.length&&!b.length ? (a=fn(a(),b()),()=>a) : ctx => fn(a(ctx),b(ctx))) :
    (a,b) => !b && (a=compile(a), !a.length ? (a=fn(a()),()=>a) : ctx => fn(a(ctx)))
  ),
  prec ? parse.set(op,prec,parseFn) : (lookup[op.charCodeAt(0)||1]=parseFn),
  compile.set(op, evalFn)
),

// create increment-assign pair from fn
num = a => a ? err() : ['', +skip(c => c === PERIOD || (c>=_0 && c<=_9) || (c===69||c===101?2:0))],
inc = (op, prec, fn, ev) => [op, prec, [
  a => a ? [op==='++'?'-':'+',[op,a],['',1]] : [op,expr(prec-1)], // ++a → [++, a], a++ → [-,[++,a],1]
  ev = (a,b) => (
    a[0] === '(' ? ev(a[1]) : // ++(((a)))
    a[0] === '.' ? (b=a[2], a=compile(a[1]), ctx => fn(a(ctx), b)) : // ++a.b
    a[0] === '[' ? ([,a,b]=a, a=compile(a),b=compile(b), ctx => fn(a(ctx),b(ctx))) : // ++a[b]
    (ctx => fn(ctx,a)) // ++a
  )
]],
list = [
  // literals
  // null operator returns first value (needed for direct literals)
  '',, [,v => () => v],

  '"',, [
    (a) => a ? err() : ['', (skip() + skip(c => c - DQUOTE ? 1 : 0) + (skip()||err('Bad string'))).slice(1,-1)],
  ],

  // .1
  '.',, [a=>!a && num()],

  // 0-9
  ...Array(10).fill(0).flatMap((_,i)=>[''+i,0,[num]]),

  // sequences
  ',', PREC_SEQ, (...args) => args[args.length-1],
  '||', PREC_SOME, (...args) => { let i=0, v; for (; !v && i < args.length; ) v = args[i++]; return v },
  '&&', PREC_EVERY, (...args) => { let i=0, v=true; for (; v && i < args.length; ) v = args[i++]; return v },

  // binaries
  '+', PREC_SUM, (a,b)=>a+b,
  '-', PREC_SUM, (a,b)=>a-b,
  '*', PREC_MULT, (a,b)=>a*b,
  '/', PREC_MULT, (a,b)=>a/b,
  '%', PREC_MULT, (a,b)=>a%b,
  '|', PREC_OR, (a,b)=>a|b,
  '&', PREC_AND, (a,b)=>a&b,
  '^', PREC_XOR, (a,b)=>a^b,
  '==', PREC_EQ, (a,b)=>a==b,
  '!=', PREC_EQ, (a,b)=>a!=b,
  '>', PREC_COMP, (a,b)=>a>b,
  '>=', PREC_COMP, (a,b)=>a>=b,
  '<', PREC_COMP, (a,b)=>a<b,
  '<=', PREC_COMP, (a,b)=>a<=b,
  '>>', PREC_SHIFT, (a,b)=>a>>b,
  '>>>', PREC_SHIFT, (a,b)=>a>>>b,
  '<<', PREC_SHIFT, (a,b)=>a<<b,

  // unaries
  '+', PREC_UNARY, a => +a,
  '-', PREC_UNARY, a => -a,
  '!', PREC_UNARY, a => !a,
  '~', PREC_UNARY, a => ~a,

  // increments
  ...inc('++', PREC_UNARY, (a,b) => ++a[b]),
  ...inc('--', PREC_UNARY, (a,b) => --a[b]),

  // a[b]
  '[', PREC_CALL, [
    a => a && ['[', a, expr(0,CBRACK)||err()],
    (a,b) => b && (a=compile(a), b=compile(b), ctx => a(ctx)[b(ctx)])
  ],

  // a.b
  '.', PREC_CALL, [
    (a,b) => a && (b=expr(PREC_CALL)) && ['.',a,b],
    (a,b) => (a=compile(a), ctx => a(ctx)[b])
  ],

  // (a,b,c), (a)
  '(', PREC_CALL, [
    a => !a && ['(', expr(0,CPAREN)||err()],
    a => compile(a)
  ],

  // a(b,c,d), a()
  '(', PREC_CALL, [
    a => a && ['(', a, expr(0,CPAREN)||''],
    (a,b,path,args) => b!=null && (
      args = b=='' ? () => [] : // a()
      b[0] === ',' ? (b=b.slice(1).map(compile), ctx => b.map(a=>a(ctx))) : // a(b,c)
      (b=compile(b), ctx => [b(ctx)]), // a(b)

      a[0] === '.' ? (path=a[2], a=compile(a[1]), ctx => a(ctx)[path](...args(ctx))) : // a.b(...args)
      a[0] === '[' ? (path=compile(a[2]), a=compile(a[1]), ctx => a(ctx)[path(ctx)](...args(ctx))) : // a[b](...args)
      (a=compile(a), ctx => a(ctx)(...args(ctx))) // a(...args)
    )
  ]
]

while (list[2]) set(...list.splice(0,3))

export default subscript
export {compile, parse}
