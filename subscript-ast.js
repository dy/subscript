import parse, { token, lookup, skip, cur, idx, err, expr, isId, space } from './parse.js'
import { evaluate, operator } from './evaluate.js'

const OPAREN=40, CPAREN=41, OBRACK=91, CBRACK=93, SPACE=32, DQUOTE=34, PERIOD=46, _0=48, _9=57,
PREC_SEQ=1, PREC_SOME=4, PREC_EVERY=5, PREC_OR=6, PREC_XOR=7, PREC_AND=8,
PREC_EQ=9, PREC_COMP=10, PREC_SHIFT=11, PREC_SUM=12, PREC_MULT=13, PREC_UNARY=15, PREC_POSTFIX=16, PREC_CALL=18, PREC_GROUP=19


const unary = (op, prec=PREC_UNARY) => token(op, a => !a && (a=expr(prec-1)) && [op, a], prec)
const binary = (op, prec) => token(op, (a, b) => a && (b=expr(prec)) && [op,a,b], prec)
const group = (op, end=op.charCodeAt(1)) => token(op=op[0], a => !a ? [op, expr(0,end)] : [op, a, expr(0,end)], PREC_CALL)
const postfix = (op, prec=PREC_POSTFIX) => token(op, (a, b) => a && [op,a,expr(prec)], prec)


// numbers
for (let op=_0;op<=_9;) lookup[op++] = () => skip(c => c === PERIOD || isId(c))

// ALT: better float detection
// const isNum = c => c>=_0 && c<=_9,
// num = n => (
//   n&&err('Unexpected number'),
//   n = skip(c=>c == PERIOD || isNum(c)),
//   (cur.charCodeAt(idx) == 69 || cur.charCodeAt(idx) == 101) && (n += skip(2) + skip(isNum)),
//   n=+n, n!=n ? err('Bad number') : [n] // 1 operand means token is static
// )
// for (let op=_0;op<=_9;) lookup[op++] = num


lookup[DQUOTE] = a => skip() + skip(c => c-DQUOTE) + skip()


group('[]')
group('()')

binary('+', PREC_SUM)
binary('-', PREC_SUM)
binary('*', PREC_MULT)
binary('/', PREC_MULT)
binary('%', PREC_MULT)
binary('.', PREC_CALL)
binary(',', PREC_SEQ)
binary('|', PREC_OR)
binary('||',  PREC_SOME)
binary('&', PREC_AND)
binary('&&',  PREC_EVERY)
binary('^', PREC_XOR)
binary('==',  PREC_EQ)
binary('!=',  PREC_EQ)
binary('>', PREC_COMP),
binary('>=',  PREC_COMP),
binary('>>',  PREC_SHIFT),
binary('>>>',  PREC_SHIFT),
binary('<', PREC_COMP),
binary('<=',  PREC_COMP),
binary('<<',  PREC_SHIFT)

unary('++')
unary('--')
unary('+')
unary('-')
unary('!')
unary('~')
unary('++')
unary('--')
postfix('++',  PREC_POSTFIX)
postfix('--',  PREC_POSTFIX)


// add eval mappers
// operator('++')
// operator('.')


/*
// inc operator builder
incr = (a,fn) => ctx => fn(a.of?a.of(ctx) : ctx, a.id(ctx)),

// call fn for all items with stride 3
each3 = (list, fn) => { while (list[0]) fn(...list.splice(0,3)) },


// custom operators
each3([
  // "a"
  '"', a => (a=a?err('Unexpected string'):skip(c => c-DQUOTE), skip()||err('Bad string'), ()=>a),,

  // a.b
  '.', (a,id) => a && (space(), id=skip(isId)||err(), fn=ctx=>a(ctx)[id], fn.id=()=>id, fn.of=a, fn), PREC_CALL,

  // .2
  '.', a => !a && (skip(-1),num()),,

  // a[b]
  '[', (a,b,fn) => a && (b=expr(0,CBRACK)||err(), fn=ctx=>a(ctx)[b(ctx)], fn.id=b, fn.of=a, fn), PREC_CALL,

  // a(), a(b), (a,b), (a+b)
  '(', (a,b,fn) => (
    b=expr(0,CPAREN),
    // a(), a(b), a(b,c,d), a.b(c,d)
    a ? (
      ctx => a(ctx).apply(a.of?.(ctx), b ? b.all ? b.all(ctx) : [b(ctx)] : [])
    ) :
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
*/

export default s => (s=s.trim()) ? parse(s) : ctx=>{}
export { unary, binary, postfix, group }
