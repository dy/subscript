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


console.time('[]')
for (let i = 0; i < MAX; i++) {
  a[0]==='a' && a[1]==='b' && a[2]==='c'
}
console.timeEnd('[]')

console.time('charCodeAt')
for (let i = 0; i < MAX; i++) {
  a.charCodeAt(0)===97 && a.charCodeAt(1)===98 && a.charCodeAt(2)===99
}
console.timeEnd('charCodeAt')
