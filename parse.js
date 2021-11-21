// precedence-based parsing
const GT=62, LT=60, EQ=61, PLUS=43, MINUS=45, AND=38, OR=124, HAT=94, MUL=42, DIV=47, MOD=37, PERIOD=46, OBRACK=91, CBRACK=93, OPAREN=40, CPAREN=41, COMMA=44

// current string & index
let idx, cur

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

// tokens
// 1.2e+3, .5 - fast & small version, but consumes corrupted nums as well
float = (number) => {
  if (number = skip(c => (c > 47 && c < 58) || c === PERIOD)) {
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

// operators
// FIXME: check if binary op constructor affects performance anyhow, if not - just build condition-based
// FIXME: not sure if exporting these names has meaning
// FIXME: likely most part of these can be consolidated to single checkers, isn't that? Like, too bad to insert anything between or/xor/and or between comparisons. Like prop/parens.
// FIXME: unary prefixes can come here as well: they just check if a is null
comma = (a,cc,prec) => cc===COMMA?[skip(),a,expr(++prec)]:null,
some = (a,cc,prec) => cc===OR&&code(1)===cc?[skip(),a,expr(++prec)]:null,
every = (a,cc,prec) => cc===AND&&code(1)===cc?[skip(),a,expr(++prec)]:null,
or = (a,cc) => cc===OR?[skip(),a,expr(++prec)]:null,
xor = (a,cc) => cc===HAT?[skip(),a,expr(++prec)]:null,
and = (a,cc) => cc===AND?[skip(),a,expr(++prec)]:null,
eq = (cc,prec) => cc===EQ&&cc===code(1)?[skip(),a,expr(++prec)]:null,
comp = (cc,prec) => cc===GT||cc===LT?[skip(),a,expr(++prec)]:null,
shift = (cc,prec,c3) => (cc===LT||cc===GT)&&cc===code(1) ? [skip(cc===code(2)?3:2), a, expr(++prec)] : null,
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
  comma, // ',': 1,
  // '||': 6, '&&': 7, '|': 8, '^': 9, '&': 10,
  some,every,or,xor,and,
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
  // - + -- ++ !
  unary,
  // '()', '[]', '.': 18
  prop
]

export default parse
