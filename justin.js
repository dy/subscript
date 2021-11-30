// justin lang https://github.com/endojs/Jessie/issues/66
import {evaluate} from './evaluate.js'
import {parse, code, char, skip, expr, err, val} from './parse.js'

const PERIOD=46, OPAREN=40, CPAREN=41, CBRACK=93, SPACE=32,

PREC_SEQ=1, PREC_TERN=3, PREC_SOME=4, PREC_EVERY=5, PREC_OR=6, PREC_XOR=7, PREC_AND=8,
PREC_EQ=9, PREC_COMP=10, PREC_SHIFT=11, PREC_SUM=12, PREC_MULT=13, PREC_UNARY=15, PREC_POSTFIX=16, PREC_CALL=18, PREC_GROUP=19,
PREC_EXP=14, PREC_TOKEN=20


// tokens
const v = v => ({valueOf:()=>v})
parse.token.push(
  // 1.2e+3, .5 - fast & small version, but consumes corrupted nums as well
  (number) => (
    (number = skip(c => (c > 47 && c < 58) || c == PERIOD)) && (
      (code() == 69 || code() == 101) && (number += skip(2) + skip(c => c >= 48 && c <= 57)),
      isNaN(number = new Number(number)) ? err('Bad number') : number
    )
  ),

  // "' with /
  (q, qc, c, str) => {
    if (q !== 34 && q !== 39) return
    qc = char(), skip(), str = ''
    while (c=code(), c-q) {
      if (c === 92) skip(), str += escape[char()] || char(); else str+=char()
      skip()
    }
    return skip(), qc + str + qc
  },

  // literal
  c =>
    c === 116 && char(4) === 'true' && skip(4) ? v(true) :
    c === 102 && char(5) === 'false' && skip(5) ? v(false) :
    c === 110 && char(4) === 'null' && skip(4) ? v(null) :
    c === 117 && char(9) === 'undefined' && skip(9) ? v(undefined) :
    null,

  // id
  c => skip(c =>
    (c >= 48 && c <= 57) || // 0..9
    (c >= 65 && c <= 90) || // A...Z
    (c >= 97 && c <= 122) || // a...z
    c == 36 || c == 95 || // $, _,
    (c >= 192 && c != 215 && c != 247) // any non-ASCII
  )
)

const escape = {n:'\n', r:'\r', t:'\t', b:'\b', f:'\f', v:'\v'}


// /**/, //
parse.space = cc => {
  while (cc = code(), cc <= 32 || cc === 47) {
    if (cc <= 32) skip()
    else if (cc === 47)
      // /**/
      if (code(1) === 42) skip(2), skip(c => c !== 42 && code(1) !== 47), skip(2)
      // //
      else if (code(1) === 47) skip(2), skip(c => c >= 32)
      else break
  }
  return cc
}


// operators
const addOps = (add, stride=2, list) => {
  for (let i = 0; i < list.length; i+=stride) add(list[i], list[i+1], list[i+2])
}

addOps(parse.operator, 3, [
  // subscript ones
  // TODO: add ,, as node here?
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
  '++', PREC_UNARY, +1,
  '-', PREC_SUM,,
  '-', PREC_UNARY, -1,
  '--', PREC_UNARY, -1,
  '--', PREC_UNARY, +1,

  // !
  '!', PREC_UNARY, -1,

  // * / %
  '*', PREC_MULT,,
  '/', PREC_MULT,,
  '%', PREC_MULT,,

  // a.b
  '.', PREC_CALL, (node,b) => node && [skip(),node, typeof (b = expr(PREC_CALL)) === 'string' ? '"' + b + '"' : b.valueOf()],

  // a[b]
  '[', PREC_CALL, (node) => (skip(), node = ['.', node, val(expr(0,CBRACK))], skip(), node),
  ']',,,

  // a(b)
  '(', PREC_CALL, (node,b) => ( skip(), b=expr(0,CPAREN), skip(),
    Array.isArray(b) && b[0]===',' ? (b[0]=node, b) : b ? [node, val(b)] : [node]
  ),
  // (a+b)
  '(', PREC_GROUP, (node,b) => !node && (skip(), b=expr(0,CPAREN) || err(), skip(), b),
  ')',,,

  // justin extension
  ';', PREC_SEQ,,
  '===', PREC_EQ,,
  '!==', PREC_EQ,,
  '**', PREC_EXP,,
  '~', PREC_UNARY, -1,
  '?', PREC_TERN, (node) => {
    if (!node) err('Expected expression')
    let a, b
    skip(), parse.space(), a = expr()
    if (code() !== 58) err('Expected :')
    skip(), parse.space(), b = expr()
    return ['?:', node, a, b]
  },
  '}',,,
  ':',,,
  'in', PREC_COMP, (node) => code(2) <= 32 && [skip(2), '"'+node+'"', expr(PREC_COMP)],

  // [a,b,c]
  '[', PREC_TOKEN, (node,arg) => !node && (
    skip(), arg=expr(0,93), skip(),
    !arg ? ['['] : arg[0] == ',' ? (arg[0]='[',arg) : ['[',arg]
  ),

  // {a:0, b:1}
  '{', PREC_TOKEN, (node,arg) => !node && (skip(), arg=expr(0,125), skip(),
    !arg ? ['{'] : arg[0] == ':' ? ['{',arg] : arg[0] == ',' ? (arg[0]='{',arg) : ['{',arg])
  ,
])

addOps(evaluate.operator, 2, [
  // subscript
  '!', a=>!a,
  '++', a=>++a,
  '--', a=>--a,

  '.', (a,b)=>a?a[b]:a,

  '%', (a,b)=>a%b,
  '/', (a,b)=>a/b,
  '*', (a,b)=>a*b,

  '+', (a,b)=>a+b,
  '-', (...a)=>a.length < 2 ? -a : a.reduce((a,b)=>a-b),

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
  ',', (a,b)=>(a,b),

  // justin extension
  '**', (...args)=>args.reduceRight((a,b)=>Math.pow(b,a)),
  '~', a=>~a,
  '?:', (a,b,c)=>a?b:c,
  'in', (a,b)=>a in b,

  // []
  '[', (...args) => Array(...args),
  // as operator it's faster to lookup (no need to call extra rule check), smaller and no conflict with word names
  '{', (...args)=>Object.fromEntries(args),
  ':', (a,b)=>[a,b]
])

// TODO ...
// TODO: strings interpolation

export { parse, evaluate }

// code → evaluator
export default s => (s = typeof s == 'string' ? parse(s) : s,  ctx => evaluate(s, ctx))
