// justin lang https://github.com/endojs/Jessie/issues/66
import {evaluate} from './evaluate.js'
import {parse, code, char, skip, expr, nil, operator, err} from './parse.js'

// ;
operator(';', 1)

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
operator('**', 14)

// ~
operator('~', 13, -1)
evaluate.operator['~'] = a=>~a

// TODO ...

// ?:
evaluate.operator['?:']=(a,b,c)=>a?b:c
operator('?', 3, (node) => {
  let a, b
  skip(), parse.space(), a = expr(0)
  if (code() !== 58) err('Expected :')
  skip(), parse.space(), b = expr(0)
  return ['?:', node, a, b]
})
// operator(':')

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
operator('in', 10, (node) => code(2) <= 32 && [skip(2), '"'+node+'"', expr(10)])

// []
evaluate.operator['['] = (...args) => Array(...args)
parse.token.unshift((cc, node, arg) =>
  cc === 91 ?
  (
    skip(), arg=expr(),
    node = arg===nil ? ['['] : arg[0] === ',' ? (arg[0]='[',arg) : ['[',arg],
    skip(), node
  ) : nil
)

// {}
parse.token.unshift((cc, node) => (
  cc === 123 ? (skip(), node = map(['{', expr()]), skip(), node) : null
))

operator('}')
operator(':', 4)
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
