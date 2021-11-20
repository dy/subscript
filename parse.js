const GT = 62, LT = 60, EQ = 61, PLUS = 43, MINUS = 45, PIPE = 124

// precedence-based parsing
let index, current

export const parse = (str, tree) => (current=str, index=0, expr()),

err = (msg='Bad syntax '+char()) => { throw Error(msg + ' at ' + index) },
skip = (is=1, from=index) => {
  if (typeof is === 'number') index += is else while (is(code())) index++;
  return current.slice(from, index)
},
space = cc => { while (cc = code(), cc < 33) index++; return cc },

code = (i=0) => current.charCodeAt(index+i),
char = (n=1) => current.substr(index, n),

token = [float, string, literal, id],

expr = (preс=0, cc, node, group, from=index) => {
  cc = space()

  // prefix or token
  while (from===index && i < token.length) node = node[i++](cc)

  // postfix or binary
  while (!(group = operator(node, prec, cc = space())));
},

// --------- token
// 1.2e+3, .5 - fast & small version, but consumes corrupted nums as well
float = (number) => {
  if (number = skip(c => (c >= 48 && c <= 57) || c === PERIOD)) {
    if (code() === 69 || code() === 101) number += skip(2) + skip(c => c >= 48 && c <= 57)
    return isNaN(number = parseFloat(number)) ? err('Bad number') : number
  }
},
// "a"
string = (q, qc) => q === 34 ? (qc = char(), index++, qc) + skip(c => c-q) + (index++, qc) : null,
// (...exp)
group = (c, node) => c === OPAREN ? (index++, node = expr(-1,CPAREN), index++, node) : null,
// var or literal
id = name => (name = skip(c =>
  (
    (c >= 48 && c <= 57) || // 0..9
    (c >= 65 && c <= 90) || // A...Z
    (c >= 97 && c <= 122) || // a...z
    c == 36 || c == 95 || // $, _,
    c >= 192 // any non-ASCII
  )
)),

token = [ float, group, string, id ],

// ------------- postfix
operator = (node, prec, cc) => {
  for (let i = prec, result; i < operators.length; i++) result = operators[i](cc)
},
// route = () => {
//   let c1 = code(), c2 = code(1)
//   // multichar op lookup redirect
//   if (c1 === GT || c1 === LT) return expr(12)
//   else if (c1 === PLUS || c1 === MINUS) return expr(14)
//   else if (c1 === EQ) return expr(11)
//   else if (c1 === PIPE) return expr(6)
//   else {
//     // TODO: lookup single-char opreator - likely useful to have a map of single-arg precedences
//   }
// },
comma = c1 => {},
ternary = c1 => {},
some = (c1, c2) => {},
every = (c1, c2) => {},
or = c1 => {},
xor = c1 => {},
and = c1 => {},
eq = (c1, c2) => {},
comp = (c1, c2) => {},
shift = (c1, c2, c3) => {},
sum = (c1) => {},
mult = (c1) => {},
unary = (c1, c2) => {},
prop = (c1, c2) => {},

operators = [
  route,
  comma, // ',': 1,
  ,
  ,
  // '?:'
  ternary,
  ,
  // '||': 6, '&&': 7, '|': 8, '^': 9, '&': 10,
  some,
  every,
  or,
  xor,
  and,

  // '==': 11, '!=': 11,
  eq,

  // '<': 12, '>': 12, '<=': 12, '>=': 12,
  comp,

  // '<<': 13, '>>': 13, '>>>': 13,
  shift,

  // '+': 14, '-': 14,
  sum,

  // '*': 15, '/': 15, '%': 15
  mult,
  ,
  // '-': 17,
  // '!': 17,
  // '+': 17,
  // '++': 17,
  // '--': 17
  unary,

  // '()', '[]', '.': 18
  prop
]




// postfix = parse.postfix = [
//   // postfix parsers merged into 1 for performance & compactness
//   (node, cc, arg) => {
//     // a.b[c](d)
//     if (cc === PERIOD) index++, space(), node = ['.', node, '"'+id()+'"']
//     else if (cc === OBRACK) index++, node = ['.', node, expr(-1,CBRACK)], index++
//     else if (cc === OPAREN)
//       index++, arg=expr(-1,CPAREN),
//       node = Array.isArray(arg) && arg[0]===',' ? (arg[0]=node, arg) : arg == null ? [node] : [node, arg],
//       index++

//     // a++, a--
//     else if ((cc===0x2b || cc===0x2d) && current.charCodeAt(index+1)===cc) node = [skip(2), node]

//     // literal
//     else if (typeof node === 'string' && literal.hasOwnProperty(node)) node = literal[node]

//     return node
//   }
// ],

// unary = parse.unary = {
//   '-': 17,
//   '!': 17,
//   '+': 17,
//   '++': 17,
//   '--': 17
// },

// binary = parse.binary = {
//   ',': 1,
//   '||': 6, '&&': 7, '|': 8, '^': 9, '&': 10,
//   '==': 11, '!=': 11,
//   '<': 12, '>': 12, '<=': 12, '>=': 12,
//   '<<': 13, '>>': 13, '>>>': 13,
//   '+': 14, '-': 14,
//   '*': 15, '/': 15, '%': 15
// }

