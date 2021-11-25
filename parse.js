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
    (cc=parse.space()) && (map = lookup[cc] || err()) && (newNode = map(node, prec))
  ) if ((node = newNode).indexOf(nil) >= 0) err()

  // console.log(prec, cc, map, node)
  // TODO
  // if (!prec && !lookup[cc]) err('Unclosed paren')

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

// operator lookup table
lookup = [],

// create operator checker/mapper (see examples)
operator = (C, PREC=0, map=1, end, prev=lookup[C]) => (
  lookup[C] = (node, prec, l, list, op) => {
    if (prec<PREC && (l = typeof map === 'number' ? map : map(node))) {
      if (typeof l === 'number') {
        l = l|0, list = [op=skip(l),node,expr(PREC)]
        // consume same-op group
        while (parse.space()==C && (skip(l)==op||(idx-=l,0))) list.push(expr(PREC))
      } else list = l
      // FIXME
      // if (end && code()!==end) err('Unclosed paren')
      return list
    }
    // decorate already assigned lookup
    else if (prev) return prev(node, prec)
  },
  end && (lookup[end] = ()=>{})
)

// ,
// TODO: add ,, as node here
operator(COMMA, PREC_COMMA)

// ||, |
operator(OR, PREC_OR)
operator(OR, PREC_SOME, n=>code(1)==OR && 2)

// &&, &
operator(AND, PREC_AND)
operator(AND, PREC_EVERY, n=>code(1)==AND && 2)

// ^
operator(HAT, PREC_XOR)

// ==, ===, !==, !=
operator(EQ, PREC_EQ, n=>code(1)==code(2)?3:2)
operator(EXCL, PREC_EQ, n=>code(1)==code(2)?3:2)

// > >= >> >>>, < <= <<
operator(GT, PREC_COMP, n=>code(1)==EQ?2:1)
operator(GT, PREC_SHIFT, n=>code(1)==GT && (code(2)===code(1)?3:2))
operator(LT, PREC_COMP, n=>code(1)==EQ?2:1)
operator(LT, PREC_SHIFT, n=>code(1)==LT && 2)

// + ++ - --
operator(PLUS, PREC_SUM)
operator(MINUS, PREC_SUM)
operator(PLUS, PREC_UNARY, (node) => (node===nil||code(1)==PLUS) && [skip(code(1)==PLUS?2:1),node===nil?expr(PREC_UNARY-1):node])
operator(MINUS, PREC_UNARY, (node) => (node===nil||code(1)==MINUS) && [skip(code(1)==MINUS?2:1),node===nil?expr(PREC_UNARY-1):node])

// ! ~
operator(EXCL, PREC_UNARY, (node) => node===nil && [skip(1),expr(PREC_UNARY-1)])

// * / %
operator(MUL, PREC_MULT)
operator(DIV, PREC_MULT)
operator(MOD, PREC_MULT)

// a.b
operator(PERIOD, PREC_CALL, (node,b) => [skip(),node,typeof (b = expr(PREC_CALL)) === 'string' ? '"' + b + '"' : b])

// a[b]
operator(OBRACK, PREC_CALL, (node) => (idx++, node = ['.', node, expr()], idx++, node), CBRACK)

// a(b)
operator(OPAREN, PREC_CALL, (node,b) => (
  idx++, b=expr(), idx++,
  Array.isArray(b) && b[0]===',' ? (b[0]=node, b) : b === nil ? [node] : [node, b]
), CPAREN)

// endings just reset token
// operator(CBRACK), operator(CPAREN)



export default parse
