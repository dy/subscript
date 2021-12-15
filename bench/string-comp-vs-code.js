const MAX = 1e6
let a = 'abcdef', b = 'abc'

console.time('string')
for (let i = 0; i < MAX; i++) {
  a.substr(0,b.length)===b
}
console.timeEnd('string')


const code = (i)=>a.charCodeAt(i)
console.time('code by code')
for (let i = 0; i < MAX; i++) {
  for (let j = 0; j < b.length; j++) code(j) === b.charCodeAt(j)
}
console.timeEnd('code by code')
