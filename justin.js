// justin lang https://github.com/endojs/Jessie/issues/66
import {evaluate} from './evaluate.js'
import {parse, code, char, skip, expr, err} from './parse.js'

// literals
const v = v => ({valueOf:()=>v})
parse.token.splice(2,0, c =>
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

// {}
parse.token.unshift((cc, node) => (
  cc === 123 && (skip(), node = map(['{', expr(0,125)]), skip(), node)
))
const map = (n, args) => {
  if (!n[1]) args = []
  else if (n[1][0]==':') args = [n[1]]
  else if (n[1][0]==',') args = n[1].slice(1)
  return ['{', ...args]
}

// parse operators
for (let i = 0, ops = [
  ';', 1,,
  '===', 9,,
  '!==', 9,,
  '**', 14,,
  '~', 13, -1,
  '?', 3, (node) => {
    if (!node) err('Expected expression')
    let a, b
    skip(), parse.space(), a = expr()
    if (code() !== 58) err('Expected :')
    skip(), parse.space(), b = expr()
    return ['?:', node, a, b]
  },
  '}',,,
  ':', 0,,
  'in', 10, (node) => code(2) <= 32 && [skip(2), '"'+node+'"', expr(10)],
  '[', 20, (node,arg) => !node && (
    skip(), arg=expr(0,93), skip(),
    !arg ? ['['] : arg[0] === ',' ? (arg[0]='[',arg) : ['[',arg]
  )
]; i < ops.length;) parse.operator(ops[i++],ops[i++],ops[i++])

// evaluate operators
for (let i = 0, ops = [
  // **
  '**', (...args)=>args.reduceRight((a,b)=>Math.pow(b,a)),

  // ~
  '~', a=>~a,

  // ?:
  '?:', (a,b,c)=>a?b:c,
  // parse.operator(':')
  // in
  'in', (a,b)=>a in b,

  // []
  '[', (...args) => Array(...args),
  // as operator it's faster to lookup (no need to call extra rule check), smaller and no conflict with word names
  '{', (...args)=>Object.fromEntries(args),
  ':', (a,b)=>[a,b]
]; i < ops.length;) evaluate.operator(ops[i++],ops[i++])

// TODO ...
// TODO: strings interpolation

export default parse
export { parse, evaluate }
