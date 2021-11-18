// literal lookup
const lit = {true: true, false: false, null: null}, n='null',t='true',f='false', MAX = 1e5

console.time('obj')
for (let i = 0, c=0; i < MAX; i++) {
  // if(obj[t], obj[n], obj[f])
  if (lit.hasOwnProperty(t), lit.hasOwnProperty(n), lit.hasOwnProperty(f)) c++
}
console.timeEnd('obj')


console.time('comp')
for (let i = 0, c=0; i < MAX; i++) {
  if(t==='true', f==='false', n==='null') c++
}
console.timeEnd('comp')
