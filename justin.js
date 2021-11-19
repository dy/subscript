// justin lang https://github.com/endojs/Jessie/issues/66
import {evaluate, operator} from './src/evaluate.js'
import {parse, binary, unary, postfix, token, literal,
        code, char, skip, space, expr} from './src/parse.js'

// undefined
literal['undefined'] = undefined

// "' with /
token[2] = (q, qc, c, str) => {
  if (q !== 34 && q !== 39) return
  qc = char(), skip(), str = ''
  while (c=code(), c-q) {
    if (c === 92) skip(), str+=escape[char()]||char()
    else str+=char()
    skip()
  }
  return qc + str + qc
}
const escape = {n:'\n', r:'\r', t:'\t', b:'\b', f:'\f', v:'\v'}

// **
binary['**'] = 16
operator['**'] = (...args)=>args.reduceRight((a,b)=>Math.pow(b,a))

// ~
unary['~'] = 17
operator['~'] = a=>~a

// ...
// unary[1]['...']=true

// ;
binary[';'] = 1

// ?:
operator['?:']=(a,b,c)=>a?b:c
postfix.push(node => {
  let a, b
  if (code() !== 63) return node
  skip(), space(), a = expr(58)
  if (code() !== 58) return node
  skip(), space(), b = expr()
  return ['?:',node, a, b]
})

// /**/, //
// comments['/*']='*/'
// comments['//']='\n'

// in
evaluate.operator['in'] = (a,b)=>a in b
parse.postfix.unshift(node => (char(2) === 'in' ? (skip(2), ['in', '"' + node + '"', expr()]) : node))

// []
operator['['] = (...args) => Array(...args)
token.push((node, arg) =>
  code() === 91 ?
  (
    skip(), arg=expr(93),
    node = arg==null ? ['['] : arg[0] === ',' ? (arg[0]='[',arg) : ['[',arg],
    skip(), node
  ) : null
)

// {}
binary[':'] = 2
token.unshift((node) => code() === 123 ? (skip(), node = map(['{',expr(125)]), skip(), node) : null)
operator['{'] = (...args)=>Object.fromEntries(args)
operator[':'] = (a,b)=>[a,b]

const map = (n, args) => {
  if (n[1]==null) args = []
  else if (n[1][0]==':') args = [n[1]]
  else if (n[1][0]==',') args = n[1].slice(1)
  return ['{', ...args]
}


// TODO: strings interpolation

export { default } from './subscript.js';
export { parse, evaluate }
