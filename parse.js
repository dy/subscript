// precedence-based parsing
const GT=62, LT=60, EQ=61, PLUS=43, MINUS=45, AND=38, OR=124, HAT=94, MUL=42, DIV=47, MOD=37, PERIOD=46, OBRACK=91, CBRACK=93, OPAREN=40, CPAREN=41, COMMA=44, SPACE=32, EXCL=33

// current string & index
let idx, cur, end

export const parse = (str, tree) => (cur=str, idx=end=0, tree=expr(), idx<cur.length ? err() : tree),

err = (msg='Bad syntax '+cur[idx]) => { throw Error(msg + ' at ' + idx) },
skip = (is=1, from=idx) => {
  if (typeof is === 'number') idx += is
  else while (is(code(0))) idx++;
  return from<idx ? cur.slice(from, idx) : undefined
},
code = i => cur.charCodeAt(idx+i),

// can be extended with comments, so we export
space = parse.space = cc => { while (cc = code(0), cc <= SPACE) idx++; return cc },

// a + b - c
expr = (prec=0, end, cc=parse.space(), node, from=idx, i=0, mapped) => {
  // prefix or token
  while (from===idx && i < token.length) node = token[i++](cc)

  // postfix or binary
  for (i = Math.max(lookup[cc=parse.space()]|0, prec); i < operator.length;) {
    if (cc===end || i<prec) break // if lookup got prec lower than current - end group
    else if (mapped = operator[i++](node, cc, i, end))
      node = mapped, i = Math.max(lookup[cc=parse.space()]|0, prec); // we pass i+1 as precision
  }

  return node
},

// tokens
token = parse.token = [
  // 1.2e+3, .5 - fast & small version, but consumes corrupted nums as well
  (number) => {
    if (number = skip(c => (c > 47 && c < 58) || c === PERIOD)) {
      if (code(0) === 69 || code(0) === 101) number += skip(2) + skip(c => c >= 48 && c <= 57)
      return isNaN(number = parseFloat(number)) ? err('Bad number') : number
    }
  },
  // "a"
  (q, qc) => q === 34 && (skip() + skip(c => c-q) + skip()),
  // (...exp)
  (c, node) => c === OPAREN && (idx++, node = expr(0,CPAREN), idx++, node),
  // var or literal
  c => skip(c =>
    (c >= 48 && c <= 57) || // 0..9
    (c >= 65 && c <= 90) || // A...Z
    (c >= 97 && c <= 122) || // a...z
    c == 36 || c == 95 || // $, _,
    c >= 192 // any non-ASCII
  )
],

operator = parse.operator = [
  // ',': 1,
  (a,cc,prec,end) => cc===COMMA && seq(a,cc,prec,end),
  // '||': 6, '&&': 7,
  (a,cc,prec,end) => cc===OR && code(1)===cc && [skip(2), a, expr(prec,end)],
  (a,cc,prec,end) => cc===AND && code(1)===cc && [skip(2), a, expr(prec,end)],
  // '|': 8, '^': 9, '&': 10,
  (a,cc,prec,end) => cc===OR && [skip(), a, expr(prec,end)],
  (a,cc,prec,end) => cc===HAT && [skip(), a, expr(prec,end)],
  (a,cc,prec,end) => cc===AND && [skip(), a, expr(prec,end)],
  // '==': 11, '!=': 11,
  (a,cc,prec,end) => (cc===EQ || cc===EXCL) && code(1)===EQ && [skip(2), a, expr(prec,end)],
  // '<': 12, '>': 12, '<=': 12, '>=': 12,
  (a,cc,prec,end) => (cc===GT || cc===LT) && cc!==code(1) && [skip(), a, expr(prec,end)],
  // '<<': 13, '>>': 13, '>>>': 13,
  (a,cc,prec,end) => (cc===LT || cc===GT) && cc===code(1) && [skip(cc===code(2)?3:2), a, expr(prec,end)],
  // '+': 14, '-': 14,
  (a,cc,prec,end) => (cc===PLUS || cc===MINUS) && a!=null && code(1) !== cc && seq(a,cc,prec,end),
  // '*': 15, '/': 15, '%': 15
  (a,cc,prec,end) => ((cc===MUL && code(1) !== MUL) || cc===DIV || cc===MOD) && seq(a,cc,prec,end),
  // -- ++ unaries
  (a,cc,prec,end) => (cc===PLUS || cc===MINUS) && code(1) === cc && [skip(2), a==null?expr(prec-1,end):a],
  // - + ! unaries
  (a,cc,prec,end) => (cc===PLUS || cc===MINUS || cc===EXCL) && a==null && [skip(1), expr(prec-1,end)],
  // '()', '[]', '.': 18
  (a,cc,prec,arg) => (
    // a.b[c](d)
    cc===PERIOD ? [skip(), a, '"'+expr(prec)+'"'] :
    cc===OBRACK ? (idx++, a = ['.', a, expr(0,CBRACK)], idx++, a) :
    cc===OPAREN ? (
      idx++, arg=expr(0,CPAREN), idx++,
      Array.isArray(arg) && arg[0]===',' ? (arg[0]=a, arg) :
      arg == null ? [a] :
      [a, arg]
    ) : null
  )
],
// consume same-op group, do..while both saves op lookups and space
seq = (node,cc,prec,end,list=[cur[idx],node]) => {
  do { skip(), list.push(expr(prec,end)) } while (parse.space()===cc)
  return list
},

// fast operator lookup table
lookup = []
lookup[COMMA] = 0
lookup[OR] = 1
lookup[AND] = 2
lookup[HAT] = 4
lookup[EQ] = lookup[EXCL] = 6
lookup[LT] = lookup[GT] = 7
lookup[PLUS] = lookup[MINUS] = 9
lookup[MUL] = lookup[DIV] = lookup[MOD] = 10
lookup[PERIOD] = lookup[OBRACK] = lookup[OPAREN] = 13

export default parse
