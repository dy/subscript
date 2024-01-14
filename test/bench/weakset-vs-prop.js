const MAX = 1e6

console.time('weakset')
let arg = [], set = new WeakSet
for (let i = 0; i < MAX; i++) {
  set.has(arg) || set.add(arg)
}
console.timeEnd('weakset')


// faster and shorter
console.time('prop')
let arg2 = []
for (let i = 0; i < MAX; i++) {
  arg2._$ || (arg2._$ = 1)
}
console.timeEnd('prop')

