import parse, {skip, expr, code, tokens, val, operator as parseOp, err} from './parse.js'
import evaluate, {operator as evalOp} from './evaluate.js'

const PERIOD=46, OPAREN=40, CPAREN=41, CBRACK=93, SPACE=32,

PREC_SEQ=1, PREC_SOME=4, PREC_EVERY=5, PREC_OR=6, PREC_XOR=7, PREC_AND=8,
PREC_EQ=9, PREC_COMP=10, PREC_SHIFT=11, PREC_SUM=12, PREC_MULT=13, PREC_UNARY=15, PREC_POSTFIX=16, PREC_CALL=18, PREC_GROUP=19

tokens.push(
  // 1.2e+3, .5 - fast & small version, but consumes corrupted nums as well
  (number) => (
    (number = skip(c => (c > 47 && c < 58) || c == PERIOD)) && (
      (code() == 69 || code() == 101) && (number += skip(2) + skip(c => c >= 48 && c <= 57)),
      isNaN(number = new Number(number)) ? err('Bad number') : number
    )
  ),
  // "a"
  (q, qc) => q == 34 && (skip() + skip(c => c-q) + skip()),
  // id
  c => skip(c =>
    (c >= 48 && c <= 57) || // 0..9
    (c >= 65 && c <= 90) || // A...Z
    (c >= 97 && c <= 122) || // a...z
    c == 36 || c == 95 || // $, _,
    c >= 192 // any non-ASCII
  )
)

const addOps = (add, stride=2, list) => {
  for (let i = 0; i < list.length; i+=stride) add(list[i], list[i+1], list[i+2])
}

addOps(parseOp, 3, [
  ',', PREC_SEQ,,

  '|', PREC_OR,,
  '||', PREC_SOME,,

  '&', PREC_AND,,
  '&&', PREC_EVERY,,

  '^', PREC_XOR,,

  // ==, !=
  '==', PREC_EQ,,
  '!=', PREC_EQ,,

  // > >= >> >>>, < <= <<
  '>', PREC_COMP,,
  '>=', PREC_COMP,,
  '>>', PREC_SHIFT,,
  '>>>', PREC_SHIFT,,
  '<', PREC_COMP,,
  '<=', PREC_COMP,,
  '<<', PREC_SHIFT,,

  // + ++ - --
  '+', PREC_SUM,,
  '+', PREC_UNARY, -1,
  '++', PREC_UNARY, -1,
  '++', PREC_POSTFIX, +1,
  '-', PREC_SUM,,
  '-', PREC_UNARY, -1,
  '--', PREC_UNARY, -1,
  '--', PREC_POSTFIX, +1,

  // ! ~
  '!', PREC_UNARY, -1,

  // * / %
  '*', PREC_MULT,,
  '/', PREC_MULT,,
  '%', PREC_MULT,,

  // a.b
  '.', PREC_CALL, (node,b) => node && [skip(),node, typeof (b = expr(PREC_CALL)) === 'string' ? '"' + b + '"' : b.valueOf()],

  // a[b]
  '[', PREC_CALL, (node) => (skip(), node = ['.', node, val(expr(0,CBRACK))], node),
  ']',,,

  // a(b)
  '(', PREC_CALL, (node,b) => ( skip(), b=expr(0,CPAREN),
    Array.isArray(b) && b[0]===',' ? (b[0]=node, b) : b ? [node, val(b)] : [node]
  ),
  // (a+b)
  '(', PREC_GROUP, (node,b) => !node && (skip(), b=expr(0,CPAREN) || err(), b),
  ')',,,
])


// evaluators
addOps(evalOp, 2, [
  '!', a=>!a,
  '++', a=>++a,
  '--', a=>--a,

  '.', (a,b)=>a?a[b]:a,

  '%', (a,b)=>a%b,
  '/', (a,b)=>a/b,
  '*', (a,b)=>a*b,

  '+', (a,b=0)=>a+b,
  '-', (a,b)=>b==null ? -a : a-b,

  '>>>', (a,b)=>a>>>b,
  '>>', (a,b)=>a>>b,
  '<<', (a,b)=>a<<b,

  '>=', (a,b)=>a>=b,
  '>', (a,b)=>a>b,
  '<=', (a,b)=>a<=b,
  '<', (a,b)=>a<b,

  '!=', (a,b)=>a!=b,
  '==', (a,b)=>a==b,

  '&', (a,b)=>a&b,
  '^', (a,b)=>a^b,
  '|', (a,b)=>a|b,
  '&&', (...a)=>a.every(Boolean),
  '||', (...a)=>a.some(Boolean),
  ',', (a,b)=>(a,b)
])

export { parse, evaluate }

// code → evaluator
export default s => (s = typeof s == 'string' ? parse(s) : s,  ctx => evaluate(s, ctx))
