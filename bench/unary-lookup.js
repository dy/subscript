// what string pattern matching is fastest?

let str = '+1234abcdefLoremIpsum', MAX = 1e5


console.time(0)
for (let i = 0, c1, c2, res=0; i < MAX; i++)
  if (c1 = str.charCodeAt(0), c2 = str.charCodeAt(1),
(c1===43&&c2===43) || (c1===45&&c2===45) || c1===43 || c1===45 || c1===33
) res++
console.timeEnd(0)

console.time(1)
for (let i = 0, c, res=0; i < MAX; i++)
  if ((c = str.substr(0,2), c === '++' || c === '--') || (c = str.substr(0,1), c === '+' || c === '-' || c === '!')) res++
console.timeEnd(1)


let ops = {'++':1, '--':1, '+':1, '-':1, '!': 1}
console.time(2)
for (let i = 0, c, res=0; i < MAX; i++)
  if (ops[c = str.substr(0,2)] || ops[c = str.substr(0,1)]) res++
console.timeEnd(2)

const nop = c =>
  c <= 32 || // ' '
  (c >= 65 && c <= 90) || // A...Z
  (c >= 97 && c <= 122) || // a...z
  (c >= 48 && c <= 57) || // 0...9
  (c == 36 || c == 95) || // $, _,
  c >= 192
console.time(2.1)
for (let i = 0, c, res=0; i < MAX; i++) {
  c = str.substr(0, nop(str.charCodeAt(1)) ? 1 : 2)
  if (ops[c]) res++
}
console.timeEnd(2.1)



console.time(3)
for (let i = 0, res=0; i < MAX; i++)
  if (/^\+\+|^--|^\+|^-|^!/.test(str)) res++
console.timeEnd(3)


// fastest for lengths < 1e4
console.time(4)
for (let i = 0, c1, c2, res=0; i < MAX; i++)
  if (c1 = str.charCodeAt(0), c2 = (c1<<8)+str.charCodeAt(1),
(c2===0x2b2b) || (c2===0x2d2d) || c1===0x2b || c1===0x2d || c1===0x21
) res++
console.timeEnd(4)


console.time(4.1)
for (let i = 0, c1, c2, res=0; i < MAX; i++)
  if (c = str.charCodeAt(0)<<8|str.charCodeAt(1),
(c===0x2b2b) || (c===0x2d2d) || c>>8===0x2b || c>>8===0x2d || c>>8===0x21
) res++
console.timeEnd(4.1)


// fastest for lengths > 1e4, otherwise - charCodeAt has better perf
console.time(5)
let enc =new TextEncoder(), arr = enc.encode(str)
for (let i = 0, c1, c2, res=0; i < MAX; i++)
  if (c1 = arr[0], c2 = (c1<<8)+arr[1],
(c2===0x2b2b) || (c2===0x2d2d) || c1===0x2b || c1===0x2d || c1===0x21
) res++
console.timeEnd(5)


