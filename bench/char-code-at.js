// wrapped function 

let str = 'abcdefghijklmnopqrstuvwxyz', index

const MAX = 1e6

index = 0 
const codei = (i=0) => str.charCodeAt((index+i)%str.length)
console.time('codei')
for (let i = 0; i < MAX; i++) code(0), index++
console.timeEnd('codei')

index = 0 
const code = () => str.charCodeAt(index%str.length)
console.time('code')
for (let i = 0; i < MAX; i++) code(), index++
console.timeEnd('code')

index = 0
console.time('bound')
const scode = str.charCodeAt.bind(str)
for (let i = 0; i < MAX; i++) scode(index++%str.length)
console.timeEnd('bound')

index = 0
let s = new String(str)
s.c = s.charCodeAt
console.time('wrapper')
for (let i = 0; i < MAX; i++) s.c(index++%str.length)
console.timeEnd('wrapper')

index = 0
console.time('direct')
for (let i = 0; i < MAX; i++) str.charCodeAt(index++%str.length)
console.timeEnd('direct')
