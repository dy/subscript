// precedence-based parsing
const GT=62, LT=60, EQ=61, PLUS=43, MINUS=45, PIPE=124, MUL=42, DIV=47, MOD=37, PERIOD=46, OBRACK=91, OPAREN=40

let idx, // index in current string
    cur // current code string parsed

export const parse = (str, tree) => (cur=str, idx=0, expr()),

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
expr = (prec=0, cc=space(), node, from=idx, i=0, mapped) => {
  // prefix or token
  while (from===idx && i < token.length) node = token[i++](cc)

  if (!node) err('Unknown token')

  // postfix or binary
  for (cc=space(), i=prec; i < operator.length;)
    if (mapped = operator[i](node, cc, i)) node = mapped, i=prec, cc=space(); else i++

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
comma = (a,cc) => {},
ternary = (a,cc) => {},
some = (a,cc,prec) => {},
every = (a,cc,prec) => {},
or = (a,cc) => {},
xor = (a,cc) => {},
and = (a,cc) => {},
eq = (cc,prec) => {},
comp = (cc,prec) => {},
shift = (cc,prec,c3) => {},
sum = (a,cc,prec) => (cc===PLUS || cc===MINUS) && code(1) !== cc ? [skip(), a, expr(++prec)] : null,
mult = (a,cc,prec) => (cc===MUL && code(1) !== MUL) || cc===DIV || cc===MOD ? [skip(), a, expr(++prec)] : null,
unary = (cc,prec) => {},
postfix = (a,cc,prec) => (cc===PLUS || cc===MINUS) ? [skip(2), node] : null,
prop = (a,cc,prec) => (
  // a.b[c](d)
  cc===PERIOD ? [skip(), a , '"'+(space(),id())+'"'] :
  cc===OBRACK ? [skip(), node, expr(CBRACK)] :
  cc===OPAREN ? (
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
