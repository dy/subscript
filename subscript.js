import {parse, token, lookup, skip, cur, idx, err, expr, isId, args, space} from './parser.js'

const OPAREN=40, CPAREN=41, OBRACK=91, CBRACK=93, SPACE=32, DQUOTE=34,
PREC_SEQ=1, PREC_SOME=4, PREC_EVERY=5, PREC_OR=6, PREC_XOR=7, PREC_AND=8,
PREC_EQ=9, PREC_COMP=10, PREC_SHIFT=11, PREC_SUM=12, PREC_MULT=13, PREC_UNARY=15, PREC_POSTFIX=16, PREC_CALL=18, PREC_GROUP=19

let u, list, op, prec, fn,

// inc operator builder
incr = (a,fn) => ctx => fn(a.of?a.of(ctx):ctx, a.id(ctx)),

// call fn for all items with stride 3
each3 = (list, fn) => { while (list[0]) fn(...list.splice(0,3)) },

// register operator
operator = (op, fn, prec) => token(op,
  // binary (2 args)
  fn.length > 1 ? (a,b) => a && (b=expr(prec)) && (
    !a.length && !b.length ? (a=fn(a(),b()), ()=>a) : // static pre-eval like `"a"+"b"`
    ctx => fn(a(ctx),b(ctx))
  ) :
  // unary postfix (1 arg)
  // fn.length ? a => a && (ctx => fn(a(ctx))) :
  // unary prefix (0 args)
  a => !a && (a=expr(prec-1)) && (ctx => fn(a(ctx))),
  prec
)

// standard operators
each3([
  '|', (a,b)=>a|b, PREC_OR,
  '||', (a,b)=>a||b, PREC_SOME,

  '&', (a,b)=>a&b, PREC_AND,
  '&&', (a,b)=>a&&b, PREC_EVERY,

  '^', (a,b)=>a^b, PREC_XOR,

  // ==, !=
  '==', (a,b)=>a==b, PREC_EQ,
  '!=', (a,b)=>a!=b, PREC_EQ,

  // > >= >> >>>, < <= <<
  '>', (a,b)=>a>b, PREC_COMP,
  '>=', (a,b)=>a>=b, PREC_COMP,
  '>>', (a,b)=>a>>b, PREC_SHIFT,
  '>>>', (a,b)=>a>>>b, PREC_SHIFT,
  '<', (a,b)=>a<b, PREC_COMP,
  '<=', (a,b)=>a<=b, PREC_COMP,
  '<<', (a,b)=>a<<b, PREC_SHIFT,

  // + -
  '+', (a,b)=>a+b, PREC_SUM,
  '+', (a)=>+a, PREC_UNARY,

  '-', (a,b)=>a-b, PREC_SUM,
  '-', (a)=>-a, PREC_UNARY,

  // ! ~
  '!', (a)=>!a, PREC_UNARY,

  // * / %
  '*', (a,b)=>a*b, PREC_MULT,
  '/', (a,b)=>a/b, PREC_MULT,
  '%', (a,b)=>a%b, PREC_MULT
], operator)

// custom operators
each3([
  // "a"
  '"', a => (a=a?err('Unexpected string'):skip(c => c-DQUOTE), skip()||err('Bad string'), ()=>a),,

  // a.b
  '.', (a,id) => a && (space(), id=skip(isId)||err(), fn=ctx=>a(ctx)[id], fn.id=()=>id, fn.of=a, fn), PREC_CALL,

  // a[b]
  '[', (a,b,fn) => a && (b=expr(0,CBRACK)||err(), fn=ctx=>a(ctx)[b(ctx)], fn.id=b, fn.of=a, fn), PREC_CALL,

  // a(), a(b), (a,b), (a+b)
  '(', (a,b,fn) => (
    b=expr(0,CPAREN),
    // a(), a(b), a(b,c,d)
    a ? ctx => a(ctx).apply(a.of?.(ctx), b ? b.all ? b.all(ctx) : [b(ctx)] : []) :
    // (a+b)
    b || err()
  ), PREC_CALL,

  // [a,b,c] or (a,b,c)
  ',', (a,prec,b=expr(PREC_SEQ),fn=ctx => (a(ctx), b(ctx))) => (
    b ? (fn.all = a.all ? ctx => [...a.all(ctx),b(ctx)] : ctx => [a(ctx),b(ctx)]) : err('Skipped argument',),
    fn
  ), PREC_SEQ,

  // a++, ++a
  '++', a => incr(a||expr(PREC_UNARY-1), a ? (a,b)=>a[b]++ : (a,b)=>++a[b]), PREC_UNARY,
  '--', a => incr(a||expr(PREC_UNARY-1), a ? (a,b)=>a[b]-- : (a,b)=>--a[b]), PREC_UNARY,
], token)

export default parse
export { operator, each3 }
