import {parse, set, lookup, skip, cur, idx, err, code, expr, isId, space} from './index.js'

const PERIOD=46, OPAREN=40, CPAREN=41, OBRACK=91, CBRACK=93, SPACE=32, DQUOTE=34, _0=48, _9=57,
PREC_SEQ=1, PREC_SOME=4, PREC_EVERY=5, PREC_OR=6, PREC_XOR=7, PREC_AND=8,
PREC_EQ=9, PREC_COMP=10, PREC_SHIFT=11, PREC_SUM=12, PREC_MULT=13, PREC_UNARY=15, PREC_POSTFIX=16, PREC_CALL=18, PREC_GROUP=19

let u, list, op, prec, fn,
    isNum = c => c>=_0 && c<=_9,
    // 1.2e+3, .5
    num = n => (
      n&&err(),
      n = skip(c=>c==PERIOD || isNum(c)),
      (code() == 69 || code() == 101) && (n += skip(2) + skip(isNum)),
      n=+n, n!=n ? err('Bad number') : () => n // 0 args means token is static
    ),

    uset = (a,fn) => a.id ? ctx => fn(ctx,a.id()) : a.prop ? (ctx,p=a.prop(ctx)) => fn(p[1],[p[2]]) : err()

// numbers
for (op=_0;op<=_9;) lookup[op++] = num

// operators
for (list=[
  // a.b, .2, 1.2 parser in one
  '.',, (a,id,fn) => !a ? num(skip(-1)) : // FIXME: .123 is not operator, so we skip back, but mb reorganizing num would be better
    (space(), id=skip(isId)||err(), fn=ctx=>a(ctx)[id], fn.prop=(ctx,p=a(ctx))=>[p[id],p,id], fn),

  // "a"
  '"',, a => (a=skip(c => c-DQUOTE), skip()||err('Bad string'), ()=>a),

  // a[b]
  '[',, (a,b,fn) => a && (b=expr(0,CBRACK)||err(), fn=ctx=>a(ctx)[b(ctx)], fn.prop=(ctx,p=a(ctx),id=b(ctx))=>[p[id],p,id], fn),

  // a(), a(b), (a,b), (a+b)
  '(',, (a,b,args,prop) => (
    b=expr(0,CPAREN),
    // a(b), a(b,c,d)
    a ? (
      args= b ? b.seq ? b.seq : ctx=>[b(ctx)] : ()=>[],
      prop=a.prop||(ctx=>[a(ctx)]),
      (ctx,thisArg,p) => ([p,thisArg]=prop(ctx), p.apply(thisArg, args(ctx)))
    ) :
    // (a+b)
    // FIXME: this can be worked around by not writing props to fn...
    b ? (b.seq=null,b) : err()
  ),

  // [a,b,c] or (a,b,c)
  ',',, (a,b,fn) => (
    b=expr(),
    fn = ctx => b(ctx),
    // FIXME: streamline, also fn === b
    fn.seq = b.seq ? (ctx,arr) => (arr=b.seq(ctx), arr.unshift(a(ctx)), arr) : ctx => [a(ctx), b(ctx)],
    fn
  ),

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
  '+', PREC_UNARY, (a)=>+a,
  '++',, a => uset(a||expr(PREC_UNARY-1), a ? (a,b)=>a[b]++ : (a,b)=>++a[b]),

  '-', PREC_SUM, (a,b)=>a-b,
  '-', PREC_UNARY, (a)=>-a,
  '--',, a => uset(a||expr(PREC_UNARY-1), a ? (a,b)=>a[b]-- : (a,b)=>--a[b]),

  // ! ~
  '!', PREC_UNARY, (a)=>!a,

  // * / %
  '*', PREC_MULT, (a,b)=>a*b,
  '/', PREC_MULT, (a,b)=>a/b,
  '%', PREC_MULT, (a,b)=>a%b
]; [op,prec,fn,...list]=list, op;) set(op,prec,fn)

export default parse
