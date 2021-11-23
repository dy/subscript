// justin lang https://github.com/endojs/Jessie/issues/66
import {evaluate} from './evaluate.js'
import {parse, code, char, skip, expr} from './parse.js'

// undefined
parse.literal['undefined'] = undefined

// "' with /
parse.token[1] = (q, qc, c, str) => {
  if (q !== 34 && q !== 39) return
  qc = char(), skip(), str = ''
  while (c=code(), c-q) {
    if (c === 92) skip(), str += escape[char()] || char(); else str+=char()
    skip()
  }
  return skip(), qc + str + qc
}
const escape = {n:'\n', r:'\r', t:'\t', b:'\b', f:'\f', v:'\v'}

// **
evaluate.operator['**'] = (...args)=>args.reduceRight((a,b)=>Math.pow(b,a))
parse.operator.splice(parse.operator.length - 3, 0,
  (a,cc,prec,end) => (cc===42 && code(1) === 42) ? [skip(2), a, expr(prec,end)] : null,
)

// detect custom operators
parse.token[3] = name => (name = skip(c =>
  (
    (c >= 48 && c <= 57) || // 0..9
    (c >= 65 && c <= 90) || // A...Z
    (c >= 97 && c <= 122) || // a...z
    c == 36 || c == 95 || // $, _,
    c >= 192 // any non-ASCII
  )// && !binary[String.fromCharCode(c)]
))

// ~
const unary = parse.operator[parse.operator.length - 2]
parse.operator[parse.operator.length-2] =
  (a,cc,prec,end) => (cc===126) && a==null && [skip(1), expr(prec-1,end)] || unary(a,cc,prec,end)
evaluate.operator['~'] = a=>~a

// // ...
// // unary[1]['...']=true

// // ;
// binary[';'] = 1

// ?:
evaluate.operator['?:']=(a,b,c)=>a?b:c
parse.operator.splice(1,0, (node,cc,prec,end) => {
  let a, b
  if (cc !== 63) return
  skip(), parse.space(), a = expr(-1,58)
  if (code() !== 58) return
  skip(), parse.space(), b = expr()
  return ['?:', node, a, b]
})

// // /**/, //
// // comments['/*']='*/'
// // comments['//']='\n'

// in
evaluate.operator['in'] = (a,b)=>a in b
parse.operator.splice(6,0, (a,cc,prec,end) => (char(2) === 'in' && [skip(2), '"' + a + '"', expr(prec,end)]))

// []
evaluate.operator['['] = (...args) => Array(...args)
parse.token.unshift((cc, node, arg) =>
  cc === 91 &&
  (
    skip(), arg=expr(0,93),
    node = arg==null ? ['['] : arg[0] === ',' ? (arg[0]='[',arg) : ['[',arg],
    skip(), node
  )
)

// {}
parse.token.unshift((cc, node) => (
  cc === 123 ? (skip(), node = map(['{',expr(0,125)]), skip(), node) : null
))
parse.operator.splice(4,0,(node,cc,prec,end) => cc===58 && [skip(),node,expr(prec,end)])
evaluate.operator['{'] = (...args)=>Object.fromEntries(args)
evaluate.operator[':'] = (a,b)=>[a,b]

const map = (n, args) => {
  if (n[1]==null) args = []
  else if (n[1][0]==':') args = [n[1]]
  else if (n[1][0]==',') args = n[1].slice(1)
  return ['{', ...args]
}



// // TODO: strings interpolation

export { default } from './subscript.js';
export { parse, evaluate }
