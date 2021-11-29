// justin lang https://github.com/endojs/Jessie/issues/66
import {evaluate} from './evaluate.js'
import {parse, code, char, skip, expr, operator, err} from './parse.js'

// ;
operator(';', 1)

// ===, !==
operator('===', 9)
operator('!==', 9)

// undefined
const v = v => ({valueOf:()=>v})
parse.token.splice(3,0, c =>
  c === 116 && char(4) === 'true' && skip(4) ? v(true) :
  c === 102 && char(5) === 'false' && skip(5) ? v(false) :
  c === 110 && char(4) === 'null' && skip(4) ? v(null) :
  c === 117 && char(9) === 'undefined' && skip(9) ? v(undefined) :
  null
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
  if (!node) err('Expected expression')
  let a, b
  skip(), parse.space(), a = expr()
  if (code() !== 58) err('Expected :')
  skip(), parse.space(), b = expr()
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
// as operator it's faster to lookup (no need to call extra rule check), smaller and no conflict with word names
operator('[', 20, (node,arg) => !node && (
  skip(), arg=expr(0,93), skip(),
  !arg ? ['['] : arg[0] === ',' ? (arg[0]='[',arg) : ['[',arg]
))

// {}
parse.token.unshift((cc, node) => (
  cc === 123 && (skip(), node = map(['{', expr(0,125)]), skip(), node)
))

operator('}')
operator(':', 0)
evaluate.operator['{'] = (...args)=>Object.fromEntries(args)
evaluate.operator[':'] = (a,b)=>[a,b]

const map = (n, args) => {
  if (!n[1]) args = []
  else if (n[1][0]==':') args = [n[1]]
  else if (n[1][0]==',') args = n[1].slice(1)
  return ['{', ...args]
}

// TODO: strings interpolation

export default parse
export { parse, evaluate }
