// precedence-based parsing
const GT=62, LT=60, EQ=61, PLUS=43, MINUS=45, AND=38, OR=124, HAT=94, MUL=42, DIV=47, MOD=37, PERIOD=46, OBRACK=91, CBRACK=93, OPAREN=40, CPAREN=41, COMMA=44, SPACE=32, EXCL=33

// current string & index
let idx, cur

export const parse = (str, tree) => (cur=str, idx=0, tree=expr(), idx<cur.length ? err() : tree),

err = (msg='Bad syntax') => { throw Error(msg + ' `' + cur[idx] + '` at ' + idx) },

notNil = (node) => node===nil?err('Bad expression'):node,

skip = (is=1, from=idx) => {
  if (typeof is === 'number') idx += is
  else while (is(code())) idx++;
  return cur.slice(from, idx) || nil
},

code = (i=0) => cur.charCodeAt(idx+i),

char = (n=1) => cur.substr(idx, n),

nil = '',

// a + b - c
expr = (prec=0, end, cc=parse.space(), node, from=idx, i=0, mapped) => {
  // prefix or token
  while (from===idx && i < parse.token.length) node = parse.token[i++](cc)

  // postfix or binary
  for (i = Math.max(lookup[cc=parse.space()]|0, prec); i < parse.operator.length;) {
    if (cc===end || i<prec) break // if lookup got prec lower than current - end group
    else if (mapped = parse.operator[i++](node, cc, i, end))
      node = mapped, i = Math.max(lookup[cc=parse.space()]|0, prec); // we pass i+1 as precision
  }

  if (!prec && end && code()!=end) err('Unclosed paren')

  return node
}


// can be extended with comments, so we export
parse.space = cc => { while (cc = code(), cc <= SPACE) idx++; return cc },

// tokens
parse.token = [
  // 1.2e+3, .5 - fast & small version, but consumes corrupted nums as well
  (number) => {
    if (number = skip(c => (c > 47 && c < 58) || c === PERIOD)) {
      if (code() === 69 || code() === 101) number += skip(2) + skip(c => c >= 48 && c <= 57)
      return isNaN(number = parseFloat(number)) ? err('Bad number') : number
    }
    return nil
  },
  // "a"
  (q, qc) => q === 34 ? (skip() + skip(c => c-q) + skip()) : nil,
  // (...exp)
  c => c === OPAREN ? ++idx && notNil(expr(0,CPAREN), idx++) : nil,
  // var or literal
  c => skip(c =>
    (c >= 48 && c <= 57) || // 0..9
    (c >= 65 && c <= 90) || // A...Z
    (c >= 97 && c <= 122) || // a...z
    c == 36 || c == 95 || // $, _,
    (c >= 192 && c != 215 && c != 247) // any non-ASCII
  )
],

parse.operator = [
  // ','
  (a,cc,prec,end) => cc==COMMA && seq(char(),a,prec,end),
  // '||' '&&'
  (a,cc,prec,end) => cc==OR && code(1)==cc && seq(char(2),a,prec,end),
  (a,cc,prec,end) => cc==AND && code(1)==cc && seq(char(2),a,prec,end),
  // '|' '^' '&'
  (a,cc,prec,end) => cc==OR && seq(char(),a,prec,end),
  (a,cc,prec,end) => cc==HAT && seq(char(),a,prec,end),
  (a,cc,prec,end) => cc==AND && seq(char(),a,prec,end),
  // '==' '!='
  (a,cc,prec,end) => (cc==EQ || cc==EXCL) && code(1)==EQ && [skip(code(1)==code(2)?3:2),notNil(a),notNil(expr(prec,end))],
  // '<' '>' '<=' '>='
  (a,cc,prec,end) => (cc==GT || cc==LT) && cc!=code(1) && [skip(),notNil(a),notNil(expr(prec,end))],
  // '<<' '>>' '>>>'
  (a,cc,prec,end) => (cc==LT || cc==GT) && cc==code(1) && [skip(cc==code(2)?3:2),notNil(a),notNil(expr(prec,end))],
  // '+' '-'
  (a,cc,prec,end) => (cc==PLUS || cc==MINUS) && a!==nil && code(1) != cc && seq(char(),a,prec,end),
  // '*' '/' '%'
  (a,cc,prec,end) => ((cc==MUL && code(1) != MUL) || cc==DIV || cc==MOD) && seq(char(),a,prec,end),
  // -- ++ unaries
  (a,cc,prec,end) => (cc==PLUS || cc==MINUS) && code(1) == cc && [skip(2),notNil(a===nil?expr(prec-1,end):a)],
  // - + ! unaries
  (a,cc,prec,end) => (cc==PLUS || cc==MINUS || cc==EXCL) && a===nil && [skip(),notNil(expr(prec-1,end))],
  // '()', '[]', '.'
  (a,cc,prec,end,b) => (
    // a.b[c](d)
    cc==PERIOD ? [skip(), a, typeof (b = notNil(expr(prec,end))) === 'string' ? '"' + b + '"' : b] :
    cc==OBRACK ? (idx++, a = ['.', a, notNil(expr(0,CBRACK))], idx++, a) :
    cc==OPAREN ? (
      idx++, b=expr(0,CPAREN), idx++,
      Array.isArray(b) && b[0]===',' ? (b[0]=a, b) :
      b === nil ? [a] :
      [a, b]
    ) : nil
  )
]

// consume same-op group, do..while both saves op lookups and space
const seq = (op,node,prec,end,list=[op, notNil(node)],cc=code()) => {
  do { skip(op.length), list.push(notNil(expr(prec,end))) }
  while (parse.space()==cc && char(op.length)==op)
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
