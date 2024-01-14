// literal lookup
const lit = {true: true, false: false, null: null}, n='null',t='true',f='false',u='undefined',x='xxx', MAX = 1e5

console.time('obj')
for (let i = 0, c=0; i < MAX; i++) {
  // if(obj[t], obj[n], obj[f])
  if (lit.hasOwnProperty(t)&&lit.hasOwnProperty(n)&&lit.hasOwnProperty(f)&&!lit.hasOwnProperty(u)&&!lit.hasOwnProperty(x)) c++
}
console.timeEnd('obj')

console.time('fast obj')
const arr = []
for (let key in lit) arr[key.charCodeAt(0)] = key
// const has = (x,c=x.charCodeAt(0),m) => (m=arr[c]) && m === x
for (let i = 0, c=0; i < MAX; i++) {
  if (arr[t.charCodeAt(0)]===t && arr[n.charCodeAt(0)]===n && arr[f.charCodeAt(0)]===f && arr[u.charCodeAt(0)]!==u && arr[x.charCodeAt(0)]!==x) c++
}
console.timeEnd('fast obj')

console.time('comp')
for (let i = 0, c=0; i < MAX; i++) {
  if(t==='true' && f==='false' && n==='null' && t!==u && x!==u) c++
}
console.timeEnd('comp')
