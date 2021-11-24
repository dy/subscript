// what string pattern matching is fastest?

let str = '+1234abcdefLoremIpsum', MAX = 1e6


console.time('charcode')
for (let i = 0, c1, c2, res=0; i < MAX; i++)
  if (c1 = str.charCodeAt(0), c2 = str.charCodeAt(1),
(c1===43&&c2===43) || (c1===45&&c2===45) || c1===43 || c1===45 || c1===33
) res++
console.timeEnd('charcode')

console.time('substr')
for (let i = 0, c, res=0; i < MAX; i++)
  if ((c = str.substr(0,2), c === '++' || c === '--') || (c = str.substr(0,1), c === '+' || c === '-' || c === '!')) res++
console.timeEnd('substr')


let ops = {'++':1, '--':1, '+':1, '-':1, '!': 1}
console.time('obj lookup')
for (let i = 0, c, res=0; i < MAX; i++)
  if (ops[c = str.substr(0,2)] || ops[c = str.substr(0,1)]) res++
console.timeEnd('obj lookup')

const id = c =>
  c <= 32 || // ' '
  (c >= 65 && c <= 90) || // A...Z
  (c >= 97 && c <= 122) || // a...z
  (c >= 48 && c <= 57) || // 0...9
  (c == 36 || c == 95) || // $, _,
  c >= 192
console.time('1-char operator')
for (let i = 0, c, res=0; i < MAX; i++) {
  c = str.substr(0, id(str.charCodeAt(1)) ? 1 : 2)
  if (ops[c]) res++
}
console.timeEnd('1-char operator')

PLUS = 43, MINUS = 45, PIPE = 124
const isSum = (c1, c2) => (c1 === MINUS && c2 !== MINUS) || (c1 === PLUS && c2 !== PLUS)

console.time('Checker')
for (let i = 0, res=0; i < MAX; i++) {
  if (isSum(str.charCodeAt(0), str.charCodeAt(1))) res++
}
console.timeEnd('Checker')

console.time('regex')
for (let i = 0, res=0; i < MAX; i++)
  if (/^\+\+|^--|^\+|^-|^!/.test(str)) res++
console.timeEnd('regex')


// fastest for lengths < 1e4
console.time('charcode double')
for (let i = 0, c1, c2, res=0; i < MAX; i++)
  if (c1 = str.charCodeAt(0), c2 = (c1<<8)+str.charCodeAt(1),
(c2===0x2b2b) || (c2===0x2d2d) || c1===0x2b || c1===0x2d || c1===0x21
) res++
console.timeEnd('charcode double')


console.time('charcode double shift')
for (let i = 0, c1, c2, res=0; i < MAX; i++)
  if (c = str.charCodeAt(0)<<8|str.charCodeAt(1),
(c===0x2b2b) || (c===0x2d2d) || c>>8===0x2b || c>>8===0x2d || c>>8===0x21
) res++
console.timeEnd('charcode double shift')


// fastest for lengths > 1e4, otherwise - charCodeAt has better perf
console.time('text encoder')
let enc = new TextEncoder(), arr = enc.encode(str)
for (let i = 0, c1, c2, res=0; i < MAX; i++)
  if (c1 = arr[0], c2 = (c1<<8)+arr[1],
(c2===0x2b2b) || (c2===0x2d2d) || c1===0x2b || c1===0x2d || c1===0x21
) res++
console.timeEnd('text encoder')


