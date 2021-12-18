import subscript, {parse, skip, char, code} from './index.js'

const PERIOD=46, OPAREN=40, CPAREN=41, CBRACK=93, SPACE=32,

PREC_SEQ=1, PREC_SOME=4, PREC_EVERY=5, PREC_OR=6, PREC_XOR=7, PREC_AND=8,
PREC_EQ=9, PREC_COMP=10, PREC_SHIFT=11, PREC_SUM=12, PREC_MULT=13, PREC_UNARY=15, PREC_POSTFIX=16, PREC_CALL=18, PREC_GROUP=19

parse.literal.push(
  // 1.2e+3, .5 - fast & small version, but consumes corrupted nums as well
  n => (n = skip(c => (c > 47 && c < 58) || c == PERIOD)) && (
    (code() == 69 || code() == 101) && (n += skip(2) + skip(c => c >= 48 && c <= 57)),
    +n
  ),
  // "a"
  (q, qc, v) => q == 34 && (skip(), v=skip(c => c-q), skip(), v)
)

for (let i = 0, call, list = [
  ',', PREC_SEQ, (a,b,ctx,args=call)=> args ?
      (call=0, (args=args==1?[a(ctx)]:args).push(b(ctx)), call=args) : // args reducer for fn calls
      b(ctx),

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
  '+', PREC_UNARY, (a=0)=>+a,
  '++', PREC_UNARY, (a=0)=>++a,
  '++', PREC_POSTFIX, a=>a++,
  '-', PREC_SUM, (a,b)=>a-b,
  '-', PREC_UNARY, (a=0)=>-a,
  '--', PREC_UNARY, (a=0)=>--a,
  '--', PREC_POSTFIX, a=>a++,

  // ! ~
  '!', PREC_UNARY, (a=0)=>!a,

  // * / %
  '*', PREC_MULT, (a,b)=>a*b,
  '/', PREC_MULT, (a,b)=>a/b,
  '%', PREC_MULT, (a,b)=>a%b,

  // a[b]
  ['[',']'], PREC_CALL, (a,b) => a[b],

  // a.b
  '.', PREC_CALL, (a,b,ctx) => a(ctx)[b()],

  // a(b)
  ['(',')'], PREC_CALL, (a,b,ctx,prev=call) => (
    a=a(ctx), call=1, b=b(ctx), b=call.map ? a.apply(ctx,b) : a(b), call=prev, b
  ),
  // (a+b)
  ['(',')'], PREC_GROUP, (a=undefined)=>a
]; i < list.length;) parse.operator(list[i++], list[i++], list[i++])

export default subscript
