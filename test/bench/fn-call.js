// args fn call

const MAX = 1e6

console.time('(x,y)')
const a = (a,b) => b === undefined ? a : a+b
for (let i = 0; i < MAX; i++) {
  a(1,2)
  a(1)
}
console.timeEnd('(x,y)')

// twice slower but well..
console.time('(...args)')
const b = (...args) => args.length > 1 ? args[0]+args[1] : args[0]
for (let i = 0; i < MAX; i++) {
  b(1,2)
  b(1)
}
console.timeEnd('(...args)')


console.time('function(a,b)')
function c (a,b) { return arguments.length > 1 ? a+b : a }
for (let i = 0; i < MAX; i++) {
  c(1,2)
  c(1)
}
console.timeEnd('function(a,b)')
