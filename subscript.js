import subscript, {parse, set, lookup, skip, cur, idx, err, code, expr, isId, space} from './index.js'

const PERIOD=46, OPAREN=40, CPAREN=41, OBRACK=91, CBRACK=93, SPACE=32, DQUOTE=34, _0=48, _9=57,
PREC_SEQ=1, PREC_SOME=4, PREC_EVERY=5, PREC_OR=6, PREC_XOR=7, PREC_AND=8,
PREC_EQ=9, PREC_COMP=10, PREC_SHIFT=11, PREC_SUM=12, PREC_MULT=13, PREC_UNARY=15, PREC_POSTFIX=16, PREC_CALL=18, PREC_GROUP=19

let u, list, op, prec, fn,
    isNum = c => c>=_0 && c<=_9,
    // 1.2e+3, .5
    num = n => (
      n = skip(c=>c==PERIOD || isNum(c)),
      (code() == 69 || code() == 101) && (n += skip(2) + skip(isNum)),
      n=+n, n!=n ? err('Bad number') : () => n // 0 args means token is static
    )

// numbers
for (op=_0;op<=_9;) lookup[op++] = num

// operators
for (list=[
  // direct tokens
  // a.b, .2, 1.2 parser in one
  '.',, (a, id) => a?.length ? (skip(), space(), id=skip(isId)||err(), ctx => a(ctx)[id]) : num(),
  // "a"
  '"',, v => (skip(), v=skip(c => c-DQUOTE), skip() || err('Bad string'), ()=>v),

  // a[b]
  '[',, (a, b) => a && (skip(), b=expr(), code()==CBRACK?skip():err(), ctx => a(ctx)[b(ctx)]),

  // a(b), (a,b)
  '(',, (a, b, args) => (
    skip(), b=expr(), code()==CPAREN?skip():err(),
    // a(), a(b), a(b,c,d)
    a ? ctx => (args=b?b(ctx):[], a(ctx).apply(ctx,args?._args||[args])) :
    // (a+b)
    ctx => (args=b(ctx), args?._args?args.pop():args)
  ),

  // operators
  ',', PREC_SEQ, (a,b) => (a=a?._args||((a=[a])._args=a)).push(b)&&a,

  '|', PREC_OR, (a,b)=>a|b,
  '||', PREC_SOME, (a,b)=>a||b,

  '&', PREC_AND, (a,b)=>a&b,
  '&&', PREC_EVERY, (a,b)=>a&&b,

  '^', PREC_XOR, (a,b)=>a^b,

  // ==, !=
  '==', PREC_EQ, (a,b)=>a==b,
  '!=', PREC_EQ, (a,b)=>a!=b,

  // > >= >> >>>, < <= <<
  '>', PREC_COMP, (a,b)=>a>b,
  '>=', PREC_COMP, (a,b)=>a>=b,
  '>>', PREC_SHIFT, (a,b)=>a>>b,
  '>>>', PREC_SHIFT, (a,b)=>a>>>b,
  '<', PREC_COMP, (a,b)=>a<b,
  '<=', PREC_COMP, (a,b)=>a<=b,
  '<<', PREC_SHIFT, (a,b)=>a<<b,

  // + ++ - --
  '+', PREC_SUM, (a,b)=>a+b,
  '+', PREC_UNARY, (a=u)=>+a,
  '++', PREC_UNARY, (a=u)=>++a,
  '++', PREC_POSTFIX, (a)=>a++,

  '-', PREC_SUM, (a,b)=>a-b,
  '-', PREC_UNARY, (a=u)=>-a,
  '--', PREC_UNARY, (a=u)=>--a,
  '--', PREC_POSTFIX, (a)=>a--,

  // ! ~
  '!', PREC_UNARY, (a=u)=>!a,

  // * / %
  '*', PREC_MULT, (a,b)=>a*b,
  '/', PREC_MULT, (a,b)=>a/b,
  '%', PREC_MULT, (a,b)=>a%b
]; [op,prec,fn,...list]=list, op;) set(op,prec,fn)

export default subscript
