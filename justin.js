// justin lang https://github.com/endojs/Jessie/issues/66
import {operators, transforms, blocks} from './subscript.js'

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

// comments
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
