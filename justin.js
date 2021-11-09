// justin lang https://github.com/endojs/Jessie/issues/66
import {binary, unary, transforms, groups, comments, quotes, literals} from './subscript.js'

// undefined
literals['undefined'] = undefined

// **
binary.splice(2,0,{'**': (...args)=>args.reduceRight((a,b)=>Math.pow(b,a))})

// ~
unary[1]['~'] = a=>~a

// ...
// unary[1]['...']=true

// ;
binary[binary.length-1][';'] = binary[binary.length-1][',']

// ?:
binary.splice(binary.length-2,0, {':':(a,b)=>[a,b], '?':(a,b)=>a??b, '?:':(a,b,c)=>a?b:c})
transforms[':'] = node => node[1][0]=='?' ? ['?:',node[1][1],node[1][2],node[2]] : node // [:, [?, a, b], c] → [?:, a, b, c]

// {}
groups['{']='}'

// /**/, //
comments['/*']='*/'
comments['//']='\n'

// in
binary[5]['in'] = (a,b)=>a in b
transforms['in'] = n => (n[1]=`"${n[1]}"`, n)

// {}, []
unary[0]['['] = binary[0]['['] = (...args) => Array(...args)
transforms['['] = n => n.length > 2 ? ['.',n[1],n[2]] :
  n[1]==='' ? [n[0]] : [n[0], ...(n[1][0]===','?n[1].slice(1).map(x=>x===''?undefined:x):[n[1]])]

groups['{']='}'
unary[0]['{'] = binary[binary.length-2]['{'] = (...args)=>Object.fromEntries(args)
binary[binary.length-2][':']=(a,b)=>[a,b]
transforms['{'] = (s, args) => {
  if (s[1]==='') args = []
  else if (s[1][0]==':') args = [s[1]]
  else if (s[1][0]==',') args = s[1].slice(1)
  return ['{', ...args]
}

// groups ['{']='}'
// binary.unshift({'[':a=>Array(...a), '{':a=>Object.fromEntries(a)})
// transforms['['] = s => s.length > 2 ? s
//   : s[1] === undefined
//   ? [Array]
//   // ['[',[',',a,[',',b],c]] → ['[',[',',a,,b,c]]
//   : [Array].concat(isnode(s[1]) ? s[1].slice(1).reduce((a,b)=>a.push(...(isnode(b)&&b[0]==','?(b[0]=undefined,b):[b]))&&a,[])
//   : s[1])
// transforms['{'] = (s,entries) => {
//   if (s[1]===undefined) return {}
//   if (s[1][0]==':') entries = [s[1].slice(1)]
//   else entries = s[1].slice(1).map(n=>n.slice(1))
//   entries = entries.map(n=>quotes[n[0][0]]?[n[0].slice(1,-1),n[1]]:n)
//   return Object.fromEntries(entries)
// }

// TODO: strings interpolation

export { default } from './subscript.js';
export * from './subscript.js'
