// precedence-based parsing
const GT=62, LT=60, EQ=61, PLUS=43, MINUS=45, AND=38, OR=124, HAT=94, MUL=42, DIV=47, MOD=37, PERIOD=46, OBRACK=91, CBRACK=93, OPAREN=40, CPAREN=41, COMMA=44, SPACE=32, EXCL=33,

  // TODO: take over precedences from MDN
  PREC_COMMA=0, PREC_SOME=1, PREC_EVERY=2, PREC_OR=3, PREC_XOR=4, PREC_AND=5,
  PREC_EQ=6, PREC_COMP=7, PREC_SHIFT=8, PREC_SUM=9, PREC_MULT=10, PREC_UNARY=11, PREC_CALL=12


// current string & index
let idx, cur

export const parse = (str, tree) => (cur=str, idx=0, tree=expr(), idx<cur.length ? err() : tree),

err = (msg='Bad syntax') => { throw Error(msg + ' `' + cur[idx] + '` at ' + idx) },

skip = (is=1, from=idx) => {
  if (typeof is === 'number') idx += is
  else while (is(code())) idx++;
  return cur.slice(from, idx) || nil
},

code = (i=0) => cur.charCodeAt(idx+i),

char = (n=1) => cur.substr(idx, n),

nil = '',

// a + b - c
expr = (prec=0, cc=parse.space(), node, from=idx, i=0, map, newNode) => {
  // prefix or token
  while (from===idx && i < parse.token.length) node = parse.token[i++](cc)

  while (
    (map = lookup[cc=parse.space()]) && (newNode = map(cc, node, prec))
  ) {
    // TODO: if map is null, throw error as unknown character maybe?

    // TODO: consume same-op here
    if ((node = newNode).indexOf(nil) >= 0) err('Bad expression')
  }

  // TODO:
  // if (end && cc!=end) err('Unclosed paren')

  return node
},

// can be extended with comments, so we export
space = parse.space = cc => { while (cc = code(), cc <= SPACE) idx++; return cc },

// tokens
token = parse.token = [
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
  c => c === OPAREN ? (++idx, c=expr(), ++idx, c===nil?err():c) : nil,
  // var
  c => skip(c =>
    (c >= 48 && c <= 57) || // 0..9
    (c >= 65 && c <= 90) || // A...Z
    (c >= 97 && c <= 122) || // a...z
    c == 36 || c == 95 || // $, _,
    (c >= 192 && c != 215 && c != 247) // any non-ASCII
  )
],

// fast operator lookup table
lookup = parse.lookup = []

// ,
lookup[COMMA] = (c,node,prec) => !prec&&[skip(),node,expr()]

// ||, |
lookup[OR] = (c,node,prec) =>
  (code(1)==OR && prec<PREC_SOME && [skip(2),node,expr(PREC_SOME)]) ||
  (prec<PREC_OR && [skip(),node,expr(PREC_OR)])

// &&, &
lookup[AND] = (c,node,prec) =>
  (code(1)==AND && prec<PREC_EVERY && [skip(2),node,expr(PREC_EVERY)]) ||
  (prec<PREC_AND && [skip(),node,expr(PREC_AND)])

// ^
lookup[HAT] = (c,node,prec) => prec<PREC_XOR && [skip(1),node,expr(PREC_XOR)]

// ==, ===, !==, !=
lookup[EQ] = lookup[EXCL] = (c,node,prec) =>
  code(1)==c && prec<PREC_EQ && [skip(code(1)==code(2)?3:2),node,expr(PREC_EQ)]

// < <= <<
lookup[LT] = lookup[GT] = (c,node,prec) =>
  (code(1)==c && prec<PREC_SHIFT && [skip(code(2)==c?3:2),node,expr(PREC_SHIFT)]) ||
  (prec<PREC_COMP && [skip(code(1)==c?2:1),node,expr(PREC_COMP)])

// + ++ - --
lookup[PLUS] = lookup[MINUS] = (c,node,prec) =>
  ((node===nil||code(1)==c) && prec<PREC_UNARY && [skip(code(1)==c?2:1),node===nil?expr(PREC_UNARY-1):node]) ||
  (prec<PREC_SUM && [skip(),node,expr(PREC_SUM)])

// ! ~
lookup[EXCL] = (c,node,prec) => (node===nil) && prec<PREC_UNARY && [skip(),expr(PREC_UNARY-1)]

// * / %
lookup[MUL] = lookup[DIV] = lookup[MOD] = (c,node,prec) => prec<PREC_MULT && [skip(),node,expr(PREC_MULT)]

// a.b[c](d)
lookup[PERIOD] = lookup[OBRACK] = lookup[OPAREN] = (cc,a,prec,b) =>
  prec<PREC_CALL && (
    cc==PERIOD ? [skip(), a, typeof (b = expr(PREC_CALL)) === 'string' ? '"' + b + '"' : b] :
    cc==OBRACK ? (idx++, a = ['.', a, expr()], idx++, a) :
    cc==OPAREN ? (
      idx++, b=expr(), idx++,
      Array.isArray(b) && b[0]===',' ? (b[0]=a, b) :
      b === nil ? [a] :
      [a, b]
    ) : null
  )

// endings just reset token
// FIXME: do we need them? any operator can close the group...
lookup[CBRACK] = lookup[CPAREN]



export default parse
