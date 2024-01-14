// binary lookup performance
const ops = {
    '||': 11, '&&': 10, '|': 9, '^': 8, '&': 7,
    '==': 6, '!=': 6,
    '<': 5, '>': 5, '<=': 5, '>=': 5,
    '<<': 4, '>>': 4, '>>>': 4,
    '+': 3, '-': 3,
    '*': 2, '/': 2, '%': 2
  },

str = '+1234abcdefLoremIpsum',

fns = [
// NOTE: can be rearranged by precedence groups, but for sake of experiment worst case is shown
  () => c3() === 0x3e3e3e,
  () => [0x3e3e, 0x3c3c, 0x3d3d, 0x213d, 0x7c7c, 0x2626].indexOf(c2()) >= 0,
  () => [0x2a, 0x2f, 0x25, 0x2b, 0x2d, 0x3c, 0x3e, 0x7c, 0x5e, 0x26].indexOf(c1()) >= 0
],

char = n => str.substr(0,n),

c1 = (i) => { return str.charCodeAt(i) }, // char code at current index
c2 = () => { return c1(1)|c1(0)<<8 }, // 2 char codes
c3 = () => { return c1(2)|c2()<<8 }, // 3 char codes

MAX = 1e6

// fastest
console.time('dict')
for (let i = 0, c, res=0, l=3, prec, op, curOp; i < MAX; i++) ops[char(3)] || ops[char(3)] || ops[char(2)] || ops[char(1)]
console.timeEnd('dict')


console.time('checkers fn')
const findr = fn=>fn()
for (let i = 0; i < MAX; i++) fns.find(findr)
console.timeEnd('checkers fn')


console.time('checkers unlist')
for (let i = 0; i < MAX; i++) for (let c = 0; c < 4;) fns[c++ % fns.length]()
console.timeEnd('checkers unlist')


console.time('checkers unfn')
for (let i = 0, c, res; i < MAX; i++) if (c3() === 0x3e3e3e ||
  (c=c2(), c===0x3e3e, c===0x3c3c, c===0x3d3d, c===0x213d, c===0x7c7c, c===0x2626) ||
  (c=c1(), c===0x2a, c===0x2f, c===0x25, c===0x2b, c===0x2d, c===0x3c, c===0x3e, c===0x7c, c===0x5e, c===0x26)) res = c
console.timeEnd('checkers unfn')


