const PERIOD=46, OPAREN=40, CPAREN=41, SPACE=32,

  PREC_SEQ=1, PREC_SOME=4, PREC_EVERY=5, PREC_OR=6, PREC_XOR=7, PREC_AND=8,
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
  // id
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
operator = (op, prec=0, map, c=op.charCodeAt(0), l=op.length, prev=lookup[c], word=op.toUpperCase()!==op) => (
  map = typeof map === 'number' ? map > 0 ?
    node => node !== nil && [skip(l), node] : // postfix unary
    node => node === nil && [skip(l), expr(prec-1)] : // prefix unary
    map,
  lookup[c] = (node, curPrec) => {
    // word operator must have space after
    if (curPrec < prec && (l<2 || char(l)==op) && (!word || code(l) <= SPACE)) {
      // custom mapper
      if (map) node = map(node) || (prev && prev(node, curPrec))
      // consume same-op group
      else {
        node = [op, node]
        do { idx+=l, node.push(expr(prec)) } while (parse.space()==c && char(l) == op && (word ? code(l) <= SPACE : 1))
      }

      // FIXME
      // if (end && code()!==end) err('Unclosed paren')
    }
    else node = prev && prev(node, curPrec)

    // decorate already assigned lookup
    return node
  }
)

// ,
for (let i = 0, ops = [
  // TODO: add ,, as node here
  ',', PREC_SEQ,,

  '|', PREC_OR,,
  '||', PREC_SOME,,

  '&', PREC_AND,,
  '&&', PREC_EVERY,,

  '^', PREC_XOR,,

  // ==, !=
  '==', PREC_EQ,,
  '!=', PREC_EQ,,

  // > >= >> >>>, < <= <<
  '>', PREC_COMP,,
  '>=', PREC_COMP,,
  '>>', PREC_SHIFT,,
  '>>>', PREC_SHIFT,,
  '<', PREC_COMP,,
  '<=', PREC_COMP,,
  '<<', PREC_SHIFT,,

  // + ++ - --
  '+', PREC_SUM,,
  '+', PREC_UNARY, -1,
  '++', PREC_UNARY, -1,
  '++', PREC_UNARY, +1,
  '-', PREC_SUM,,
  '-', PREC_UNARY, -1,
  '--', PREC_UNARY, -1,
  '--', PREC_UNARY, +1,

  // ! ~
  '!', PREC_UNARY, -1,

  // * / %
  '*', PREC_MULT,,
  '/', PREC_MULT,,
  '%', PREC_MULT,,

  // a.b
  '.', PREC_CALL, (node,b) => [skip(),node, typeof (b = expr(PREC_CALL)) === 'string' ? '"' + b + '"' : b],

  // a[b]
  '[', PREC_CALL, (node) => (idx++, node = ['.', node, expr()], idx++, node),
  ']',,,

  // a(b)
  '(', PREC_CALL, (node,b) => (
    idx++, b=expr(), idx++,
    Array.isArray(b) && b[0]===',' ? (b[0]=node, b) : b === nil ? [node] : [node, b]
  ),
  ')',,,
]; i < ops.length;) operator(ops[i++],ops[i++],ops[i++])


export default parse
