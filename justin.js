// justin lang https://github.com/endojs/Jessie/issues/66
import sub, {operators, transforms, blocks, comments, quotes} from './subscript.js'

// **
operators.splice(2,0,{'**': (...args)=>args.reduceRight((a,b)=>Math.pow(b,a))})

// ~
operators[1]['~'] = a=>~a

// ...
// operators[1]['...']=true

// ;
operators[operators.length-1][';'] = operators[operators.length-1][',']

// ?:
operators.splice(operators.length-2,0, {':':(a,b)=>[a,b], '?':(a,b)=>a??b, '?:':(a,b,c)=>a?b:c})
transforms[':'] = node => node[1][0]=='?' ? ['?:',node[1][1],node[1][2],node[2]] : node // [:, [?, a, b], c] → [?:, a, b, c]

// {}
blocks['{']='}'

// /**/, //
comments['/*']='*/'
comments['//']='\n'

// in
operators[5]['in'] = (a,b)=>a in b
transforms['in'] = n => (n[1]=`"${n[1]}"`, n)

// {}, []
blocks['{']='}'
operators.unshift({'[':a=>Array(...a), '{':a=>Object.fromEntries(a)})
transforms['['] = s => s.length > 2 ? s
  : s[1] === undefined
  ? [Array]
  // ['[',[',',a,[',',b],c]] → ['[',[',',a,,b,c]]
  : [Array].concat(isnode(s[1]) ? s[1].slice(1).reduce((a,b)=>a.push(...(isnode(b)&&b[0]==','?(b[0]=undefined,b):[b]))&&a,[])
  : s[1])
transforms['{'] = (s,entries) => {
  if (s[1]===undefined) return {}
  if (s[1][0]==':') entries = [s[1].slice(1)]
  else entries = s[1].slice(1).map(n=>n.slice(1))
  entries = entries.map(n=>quotes[n[0][0]]?[n[0].slice(1,-1),n[1]]:n)
  return Object.fromEntries(entries)
}

// TODO: strings interpolation

export * from './subscript.js'
