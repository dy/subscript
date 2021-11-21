// precedence-based parsing
const GT=62, LT=60, EQ=61, PLUS=43, MINUS=45, PIPE=124, MUL=42, DIV=47, MOD=37, PERIOD=46, OBRACK=91, OPAREN=40

let idx, // index in current string
    cur, // current code string parsed
    prec // current precedence level (start in operators lookup)

export const parse = (str, tree) => (cur=str, prec=idx=0, expr()),

err = (msg='Bad syntax '+char()) => { throw Error(msg + ' at ' + idx) },
skip = (is=1, from=idx) => {
  if (typeof is === 'number') idx += is
  else while (is(code())) idx++;
  return cur.slice(from, idx)
},
space = cc => { while (cc = code(), cc < 33) idx++; return cc },

code = (i=0) => cur.charCodeAt(idx+i),
char = (n=1) => cur.substr(idx, n),

//a + b
expr = (cc=space(), node, from=idx, pprec=prec, i=0, mapped) => {
  // prefix or token
  while (from===idx && i < token.length) node = token[i++](cc)

  if (!node) err('Unknown token')

  // postfix or binary
  for (cc=space(); prec < operator.length;)
    if (mapped = operator[prec](node, cc)) node = mapped, prec=pprec, cc=space(); else prec++

  prec = pprec
  return node
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
string = (q, qc) => q === 34 ? (qc = char(), idx++, qc) + skip(c => c-q) + (idx++, qc) : null,
// (...exp)
group = (c, node) => c === OPAREN ? (idx++, node = expr(-1,CPAREN), idx++, node) : null,
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

// ------------- operator
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
comma = (a,c1) => {},
ternary = (a,c1) => {},
some = (a,c1,c2) => {},
every = (a,c1,c2) => {},
or = (a,c1) => {},
xor = (a,c1) => {},
and = (a,c1) => {},
eq = (c1,c2) => {},
comp = (c1,c2) => {},
shift = (c1,c2,c3) => {},
sum = (a,c1,c2) => (c1===PLUS || c1===MINUS) && c2 !== c1 ? [skip(), a, expr()] : null,
mult = (a,c1,c2) => (c1===MUL && c2 !== MUL) || c1===DIV || c1===MOD ? [skip(), a, expr()] : null,
unary = (c1,c2) => {},
postfix = (a,c1,c2) => (c1===PLUS || c1===MINUS) && c2===c1 ? [skip(2), node] : null,
prop = (a,c1,c2) => (
  // a.b[c](d)
  c1===PERIOD ? [skip(), a , '"'+(space(),id())+'"'] :
  c1===OBRACK ? [skip(), node, expr(CBRACK)] :
  c1===OPAREN ? (
    idx++, arg=expr(CPAREN), idx++,
    Array.isArray(arg) && arg[0]===',' ? (arg[0]=node, arg) :
    arg == null ? [node] :
    [node, arg]
  ) : null
),

operator = [
  // route,
  comma, // ',': 1,
  // '?:'
  ternary,
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
  // '-': 17,
  // '!': 17,
  // '+': 17,
  // '++': 17,
  // '--': 17
  unary,
  // '()', '[]', '.': 18
  prop
]

export default parse


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

