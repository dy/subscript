// justin lang https://github.com/endojs/Jessie/issues/66
import {evaluate} from './evaluate.js'
import {parse, code, char, skip, expr, nil, binary, unary} from './parse.js'

// ;
parse.operator[0] = binary(c => c==44||c==59)

// undefined
parse.token.splice(3,0, c =>
  c === 116 && char(4) === 'true' && skip(4) ? true :
  c === 102 && char(5) === 'false' && skip(5) ? false :
  c === 110 && char(4) === 'null' && skip(4) ? null :
  c === 117 && char(9) === 'undefined' && skip(9) ? undefined :
  undefined
)

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
parse.operator.splice(parse.operator.length - 3, 0, binary(cc=>cc===42 && code(1) === cc && 2))

// ~
parse.operator.splice(parse.operator.length-2, 0, unary(cc => cc === 126))
evaluate.operator['~'] = a=>~a

// TODO ...
// // unary[1]['...']=true


// ?:
evaluate.operator['?:']=(a,b,c)=>a?b:c
parse.operator.splice(1,0, (node,cc,prec,end) => {
  let a, b
  if (cc !== 63) return
  if (node===nil) err('Bad expression')
  skip(), parse.space(), a = expr(-1,58)
  if (code() !== 58) return
  skip(), parse.space(), b = expr()
  return ['?:', node, a, b]
})

// /**/, //
parse.space = cc => {
  while (cc = code(), cc <= 32) {
    skip()
    if (code() === 47)
      // /**/
      if (code(1) === 42) skip(2), skip(c => c !== 42 && code(1) !== 47), skip(2)
      // //
      else if (code(1) === 47) skip(2), skip(c => c >= 32)
  }
  return cc
}

// in
evaluate.operator['in'] = (a,b)=>a in b
parse.operator.splice(6,0,(a,cc,prec,end) => (char(2) === 'in' && [skip(2), '"' + a + '"', expr(prec,end)]))

// []
evaluate.operator['['] = (...args) => Array(...args)
parse.token.unshift((cc, node, arg) =>
  cc === 91 &&
  (
    skip(), arg=expr(0,93),
    node = arg===nil ? ['['] : arg[0] === ',' ? (arg[0]='[',arg) : ['[',arg],
    skip(), node
  )
)

// {}
parse.token.unshift((cc, node) => (
  cc === 123 ? (skip(), node = map(['{',expr(0,125)]), skip(), node) : null
))
parse.operator.splice(4,0, binary(cc=>cc===58))
evaluate.operator['{'] = (...args)=>Object.fromEntries(args)
evaluate.operator[':'] = (a,b)=>[a,b]

const map = (n, args) => {
  if (n[1]===nil) args = []
  else if (n[1][0]==':') args = [n[1]]
  else if (n[1][0]==',') args = n[1].slice(1)
  return ['{', ...args]
}

// TODO: strings interpolation

export default parse
export { parse, evaluate }
