// precedence-based parsing
const GT=62, LT=60, EQ=61, PLUS=43, MINUS=45, AND=38, OR=124, HAT=94, MUL=42, DIV=47, MOD=37, PERIOD=46, OBRACK=91, CBRACK=93, OPAREN=40, CPAREN=41, COMMA=44, SPACE=32, EXCL=33,

  PREC_COMMA=1, PREC_SOME=4, PREC_EVERY=5, PREC_OR=6, PREC_XOR=7, PREC_AND=8,
  PREC_EQ=9, PREC_COMP=10, PREC_SHIFT=11, PREC_SUM=12, PREC_MULT=13, PREC_UNARY=15, PREC_POSTFIX=16, PREC_CALL=18


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

  // operator
  while (
    (cc=parse.space()) && (map = lookup[cc] || err()) && (newNode = map(cc, node, prec))
  ) if ((node = newNode).indexOf(nil) >= 0) err()

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
lookup = parse.lookup = [],

// TODO: binary must embrace assigning operators, instead of raw access to lookup table, like binary(char, prec, cond)
// TODO: decorating strategy, opposed to returned length from condition: binary(OR, PREC_OR, 2), binary(OR, PREC_SOME, cond)
// TODO: binary must do group-consuming and error throw on unknown operator
// TODO: it should also check for non-null operator to avoid confusion with unary
binary = (C, PREC, is=1, map, prev=lookup[C]) => (
  lookup[C] = (c, node, prec, l, list, op) => {
    if (node===nil) err()
    if (prec<PREC && (l = typeof is === 'function' ? is(c,node) : is)) {
      if (typeof l === 'number') {
        // consume same-op group, do..while saves op lookups
        list = [op=char(l),node]
        do { skip(l), list.push(expr(PREC)) } while (parse.space()==c && char(l)==op)
      } else list = l
      return list
    }
    else if (prev) return prev(c, node, prec)
  }
)
  // prec<PREC && (l=is?is(c)|0:1) ? [skip(l), node, expr(PREC)] : prev&&prev(c, node, prec)


// FIXME: catch unfound operator as cond ? node : err()

// ,
// TODO: add ,, as node here
binary(COMMA, PREC_COMMA)
// lookup[COMMA] = (c,node,prec) => !prec&&[skip(),node,expr()]


// ||, |
binary(OR, PREC_OR)
binary(OR, PREC_SOME, c=>code(1)==OR && 2)
// lookup[OR] = (c,node,prec) =>
//   (code(1)==OR && prec<PREC_SOME && [skip(2),node,expr(PREC_SOME)]) ||
//   (prec<PREC_OR && [skip(),node,expr(PREC_OR)])

// &&, &
binary(AND, PREC_AND)
binary(AND, PREC_EVERY, c=>code(1)==AND && 2)
// lookup[AND] = (c,node,prec) =>
//   (code(1)==AND && prec<PREC_EVERY && [skip(2),node,expr(PREC_EVERY)]) ||
//   (prec<PREC_AND && [skip(),node,expr(PREC_AND)])

// ^
binary(HAT, PREC_XOR)
// lookup[HAT] = (c,node,prec) => prec<PREC_XOR && [skip(1),node,expr(PREC_XOR)]

// ==, ===, !==, !=
binary(EQ, PREC_EQ, c=>code(1)==code(2)?3:2)
binary(EXCL, PREC_EQ, c=>code(1)==code(2)?3:2)
// FIXME: remove c argument
// lookup[EQ] = lookup[EXCL] = (c,node,prec) =>
//   code(1)==c && prec<PREC_EQ && [skip(code(1)==code(2)?3:2),node,expr(PREC_EQ)]

// > >= >> >>>, < <= <<
binary(GT, PREC_COMP, c=>code(1)==EQ?2:1)
binary(GT, PREC_SHIFT, c=>code(1)==c && (code(2)===code(1)?3:2))
binary(LT, PREC_COMP, c=>code(1)==EQ?2:1)
binary(LT, PREC_SHIFT, c=>code(1)==c && 2)
// lookup[LT] = lookup[GT] = (c,node,prec) =>
//   (code(1)==c && prec<PREC_SHIFT && [skip(code(2)==c?3:2),node,expr(PREC_SHIFT)]) ||
//   (prec<PREC_COMP && [skip(code(1)==c?2:1),node,expr(PREC_COMP)])

// + ++ - --
// binary(PLUS, PREC_SUM)
// binary(MINUS, PREC_SUM)
// unary(PLUS, PREC_POSTFIX, c=>code(1)==c && 2, true)
// unary(PLUS, PREC_UNARY, c=>code(1)==c ? 2 : 1)
lookup[PLUS] = lookup[MINUS] = (c,node,prec) =>
  ((node===nil||code(1)==c) && prec<PREC_UNARY && [skip(code(1)==c?2:1),node===nil?expr(PREC_UNARY-1):node]) ||
  (prec<PREC_SUM && [skip(),node,expr(PREC_SUM)])

// ! ~
// unary(EXCL, PREC_UNARY)
lookup[EXCL] = (c,node,prec) => (node===nil) && prec<PREC_UNARY && [skip(),expr(PREC_UNARY-1)]

// * / %
binary(MUL, PREC_MULT)
binary(DIV, PREC_MULT)
binary(MOD, PREC_MULT)
// lookup[MUL] = lookup[DIV] = lookup[MOD] = (c,node,prec) => prec<PREC_MULT && [skip(),node,expr(PREC_MULT)]

// a.b
lookup[PERIOD] = (c,node,prec,b) => prec<PREC_CALL && [skip(), node, typeof (b = expr(PREC_CALL)) === 'string' ? '"' + b + '"' : b]
// a[b]
lookup[OBRACK] = (c,node,prec) => prec<PREC_CALL && (idx++, node = ['.', node, expr()], idx++, node)
// a(b)
lookup[OPAREN] = (c,node,prec,b) => prec<PREC_CALL && (
  idx++, b=expr(), idx++,
  Array.isArray(b) && b[0]===',' ? (b[0]=node, b) : b === nil ? [node] : [node, b]
)

// endings just reset token
lookup[CBRACK] = lookup[CPAREN] = _=>{}



export default parse
