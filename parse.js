// precedence-based parsing
const GT=62, LT=60, EQ=61, PLUS=43, MINUS=45, AND=38, OR=124, HAT=94, MUL=42, DIV=47, MOD=37, PERIOD=46, OBRACK=91, CBRACK=93, OPAREN=40, CPAREN=41, COMMA=44, SPACE=32, EXCL=33

// current string & index
let idx, cur, end

export const parse = (str, tree) => (cur=str, idx=0, expr()),

err = (msg='Bad syntax '+char()) => { throw Error(msg + ' at ' + idx) },
skip = (is=1, from=idx) => {
  if (typeof is === 'number') idx += is
  else while (is(code())) idx++;
  return cur.slice(from, idx)
},
space = cc => { while (cc = code(), cc <= SPACE) idx++; return cc },

code = (i=0) => cur.charCodeAt(idx+i),
char = (n=1) => cur.substr(idx, n),

// a + b - c
expr = (prec=0, end, cc=space(), node, from=idx, i=0, mapped) => {
  // prefix or token
  while (from===idx && i < token.length) node = token[i++](cc)

  // postfix or binary
  for (cc=space(), i=prec; i < operator.length;)
    if (cc===end) break
    else if (mapped = operator[i++](node, cc, i, end)) node = mapped, i=prec, cc=space(); // we pass i+1 as precision


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
string = (q, qc) => q === 34 ? (qc = char(), idx++, qc) + skip(c => c-q) + (idx++, qc) : '',
// (...exp)
group = (c, node) => c === OPAREN ? (idx++, node = expr(0,CPAREN), idx++, node) : '',
// var or literal
id = name => skip(c =>
  (
    (c >= 48 && c <= 57) || // 0..9
    (c >= 65 && c <= 90) || // A...Z
    (c >= 97 && c <= 122) || // a...z
    c == 36 || c == 95 || // $, _,
    c >= 192 // any non-ASCII
  )
),
token = [ float, group, string, id ],

// operators
// FIXME: check if binary op constructor affects performance anyhow, if not - just build condition-based
// FIXME: unary prefixes can come here as well: they just check if a is null
// FIXME: seems that we have to consume same-level operators. That speeds up groups, as well as resolves unary issue.
operator = [
  // ',': 1,
  (a,cc,prec,end) => cc===COMMA ? [skip(),a,expr(prec,end)] : null,
  // '||': 6, '&&': 7,
  (a,cc,prec,end) => cc===OR&&code(1)===cc ? [skip(),a,expr(prec,end)] : null,
  (a,cc,prec,end) => cc===AND&&code(1)===cc ? [skip(),a,expr(prec,end)] : null,
  // '|': 8, '^': 9, '&': 10,
  (a,cc,prec,end) => cc===OR ? [skip(),a,expr(prec,end)] : null,
  (a,cc,prec,end) => cc===HAT ? [skip(),a,expr(prec,end)] : null,
  (a,cc,prec,end) => cc===AND ? [skip(),a,expr(prec,end)] : null,
  // '==': 11, '!=': 11,
  (a,cc,prec,end) => cc===EQ&&cc===code(1) ? [skip(),a,expr(prec,end)] : null,
  // '<': 12, '>': 12, '<=': 12, '>=': 12,
  (a,cc,prec,end) => cc===GT||cc===LT ? [skip(),a,expr(prec,end)] : null,
  // '<<': 13, '>>': 13, '>>>': 13,
  (a,cc,prec,end) => (cc===LT||cc===GT)&&cc===code(1) ? [skip(cc===code(2)?3:2), a, expr(prec,end)] : null,
  // '+': 14, '-': 14,
  (a,cc,prec,end) => (cc===PLUS || cc===MINUS) && a!=='' && code(1) !== cc ? [skip(), a, expr(prec,end)] : null,
  // '*': 15, '/': 15, '%': 15
  (a,cc,prec,end) => (cc===MUL && code(1) !== MUL) || cc===DIV || cc===MOD ? [skip(), a, expr(prec,end)] : null,
  // -- ++ unaries
  (a,cc,prec,end) => (cc===PLUS || cc===MINUS) && code(1) === cc ? [skip(2), a===''?expr(prec,end):a] : null,
  // - + ! unaries
  (a,cc,prec,end) => (cc===PLUS || cc===MINUS || cc===EXCL)&&a==='' ? [skip(1), expr(prec,end)] : null,
  // '()', '[]', '.': 18
  (a,cc,prec,arg) => (
    // a.b[c](d)
    cc===PERIOD ? [skip(), a , '"'+(space(), id())+'"'] :
    cc===OBRACK ? (idx++, a = ['.', a, expr(0,CBRACK)], idx++, a) :
    cc===OPAREN ? (
      idx++, arg=expr(0,CPAREN), idx++,
      Array.isArray(arg) && arg[0]===',' ? (arg[0]=a, arg) :
      arg == null ? [a] :
      [a, arg]
    ) : null
  )
]

export default parse
