const MAX = 1e6, args = [1,2,3,4,5,6,7,8,9,10,11,12,123,1234,1234567]

// 1. Renew array
let a = []
console.time('rebuild args')
for (let i = 0; i < MAX; i++) {
  for (let j = 0; j < args.length; j++) a[j]=args[j]
}
console.timeEnd('rebuild args')


// 2. Args getter
a=[]
console.time('args getters')
for (let j = 0; j < args.length; j++) Object.defineProperty(a,j,{get:()=>args[j]})
for (let i = 0; i < MAX; i++) {
  for (let j = 0; j < args.length; j++) a[i]
}
console.timeEnd('args getters')
