import parse, { token, lookup, skip, cur, idx, err, expr, isId, space } from './parse.js'
import { compile, evaluate, operator } from './evaluate.js'

const OPAREN=40, CPAREN=41, OBRACK=91, CBRACK=93, SPACE=32, DQUOTE=34, PERIOD=46, _0=48, _9=57,
PREC_SEQ=1, PREC_SOME=4, PREC_EVERY=5, PREC_OR=6, PREC_XOR=7, PREC_AND=8,
PREC_EQ=9, PREC_COMP=10, PREC_SHIFT=11, PREC_SUM=12, PREC_MULT=13, PREC_UNARY=15, PREC_POSTFIX=16, PREC_CALL=18, PREC_GROUP=19

// FIXME: operator can be generalized to op, a? b? prec/end? assoc?
// FIXME: ? maybe rename to postfix, prefix, infix? eg. prefix may have multiple operands, eg. if a b
// FIXME: and - maybe move to parse? Is parsing tightly coupled with expressions?
// const postfix = (op, prec=PREC_POSTFIX) => token(op, (a, b) => a && [op,a,expr(prec)], prec)

// number-like ids
for (let op=_0; op<=_9;) lookup[op++] = () => ['Number', skip(c => c === PERIOD || (c>=_0&c<=_9) || (c===69||c===101?2:0))]
lookup[PERIOD] = (a)=>!a&&lookup[_0]()
operator.Number = (a,b) => (b=+a, () => b)

lookup[DQUOTE] = () => ['String', skip() + skip(c => c!=DQUOTE) + skip()]
operator.String = (a,b) => (b=a.slice(1,-1), () => b)

// token('true', a => ['Boolean', 'true'])
// operator.Boolean = (a,b) => (b=a[0]==='t', () => b),

const each3 = (list, fn) => { while (list[0]) fn(list.shift(),list.shift(),list.shift()) }

// sequences
each3([
  ',', PREC_SEQ, args => args[args.length-1],
  '||',  PREC_SOME, (args, i=0, v) => { for (; !v && i < args.length; ) v = args[i++]; return v },
  '&&',  PREC_EVERY, (args, i=0, v=true) => { for (; v && i < args.length; ) v = args[i++]; return v }
], (op, prec, fn) => {
  token(op, (a, b) => a && (b=expr(prec)) && (a[0] === op && a[2] ? (a.push(b), a) : [op,a,b]), prec)
  // FIXME: these can be even more optimized via wasm
  operator[op] = (...args) => (args=args.map(compile), ctx => fn(args.map(arg=>arg(ctx))))
})

// binaries
export const binary = (op, prec, fn, right=0) => {
  token(op, (a, b) => a && (b=expr(prec-right)) && [op,a,b], prec)
  // FIXME: there can really be tiny wasm binary fragment from https://youtu.be/awe7swqFOOw?t=778 - can be reverse-engineered via wat2wasm
  if (fn) operator[op] = (a,b) => (a=compile(a),b=compile(b), !a.length&&!b.length ? (a=fn(a(),b()),()=>a) : ctx => fn(a(ctx),b(ctx)))
}
each3([
  '+', PREC_SUM, (a,b) => a+b,
  '-', PREC_SUM, (a,b)=> a-b,
  '*', PREC_MULT, (a,b) => a*b,
  '/', PREC_MULT, (a,b)=>a/b,
  '%', PREC_MULT, (a,b)=>a%b,
  '|', PREC_OR, (a,b)=>a|b,
  '&', PREC_AND, (a,b)=>a&b,
  '^', PREC_XOR, (a,b)=>a^b,
  '==',  PREC_EQ, (a,b)=>a==b,
  '!=',  PREC_EQ, (a,b)=>a!=b,
  '>', PREC_COMP, (a,b)=>a>b,
  '>=',  PREC_COMP, (a,b)=>a>=b,
  '<', PREC_COMP, (a,b)=>a<b,
  '<=',  PREC_COMP, (a,b)=>a<=b,
  '>>',  PREC_SHIFT, (a,b)=>a>>b,
  '>>>',  PREC_SHIFT, (a,b)=>a>>>b,
  '<<',  PREC_SHIFT, (a,b)=>a<<b,

  '.', PREC_CALL,,
], binary)

// special . eval
operator['.'] = (a,b) => (a=compile(a), ctx => a(ctx)[b])


// unaries
each3([
  '+', PREC_UNARY, a => +a,
  '-', PREC_UNARY, a => -a,
  '!', PREC_UNARY, a => !a,
  '~', PREC_UNARY, a => ~a,
], (op, prec, fn) => {
  token(op, a => !a && (a=expr(prec-1)) && [op, a], prec)
  const prev = operator[op]
  operator[op] = (a,b) => b ? prev(a,b) : (a=compile(a), !a.length ? (a=fn(a()),()=>a) : ctx => fn(a(ctx)))
})

// increments
each3([
  '++', PREC_UNARY, (a,b) => ++a[b],
  '--', PREC_UNARY, (a,b) => --a[b],
], (op, prec, fn) => {
  token(op, a => a ? [op==='++'?'-':'+',[op,a],['Number','1']] : [op,expr(prec-1)], prec) // ++a → [++, a], a++ → [-,[++,a],1]
  operator[op] = (a,b) => (
    a[0] === '.' ? (a=compile(a[1]),b=a[2], ctx => fn(a(ctx), b)) : // ++a.b
    a[0] === '[' ? (a=compile(a[1]),b=compile(a[2]), ctx => fn(a(ctx),b(ctx))) : // ++a[b]
    ctx => fn(ctx,a) // ++a
  )
})

// groups
each3([
  '[]', PREC_CALL, (a,b) => (a=compile(a), b=compile(b), ctx => a(ctx)[b(ctx)]),
  '()', PREC_CALL, (a,b,path,args) => (
    b == null ? compile(a) : // (a,b,c), (a)
    (
      args = b=='' ? () => [] : // a()
      b[0] === ',' ? (b=b.slice(1).map(compile), ctx => b.map(a=>a(ctx))) : // a(b,c)
      (b=compile(b), ctx => [b(ctx)]), // a(b)

      a[0] === '.' ? (path=a[2], a=compile(a[1]), ctx => a(ctx)[path](...args(ctx))) : // a.b(...args)
      a[0] === '[' ? (path=compile(a[2]), a=compile(a[1]), ctx => a(ctx)[path(ctx)](...args(ctx))) : // a[b](...args)
      (a=compile(a), ctx => a(ctx)(...args(ctx))) // a(...args)
    )
  )
], (op, prec, fn, end=op.charCodeAt(1)) => {
  token(op=op[0], a => !a ? [op, expr(0,end)||''] : [op, a, expr(0,end)||''], prec)
  operator[op] = fn
})

export default s => (s=s.trim(), s ? (s=parse(s.trim()), evaluate.bind(0,s)) : ()=>{})


