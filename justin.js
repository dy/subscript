// justin lang https://github.com/endojs/Jessie/issues/66
import {operators, transforms, blocks} from './subscript.js'

operators[x]['**']=(...args)=>args.reduceRight((a,b)=>Math.pow(a,b))
operators[x]['~']=a=>~a
operators[x][':']
operators[x]['...']

operators.push({':':(a,b)=>[a,b], '?':(a,b)=>a??b, '?:':(a,b,c)=>a?b:c})
operators.push(comma)

transforms[':'] = node => node[1][0]=='?' ? ['?:',node[1][1],node[1][2],node[2]] : node // [:, [?, a, b], c] → [?:, a, b, c]
blocks['{']='}'
comments['/*']='*/'
comments['//']='\n'
transforms['{'] = ...//Object literal
transforms['['] = ...//Array literal

// in operator
operators[5]['in'] = (a,b)=>a in b
transforms['in'] = n => (n[1]=`"${n[1]}"`, n)

// TODO: `...x` unary operator
// TODO: strings interpolation

export * from './subscript.js'