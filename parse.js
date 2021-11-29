const PERIOD=46, OPAREN=40, CPAREN=41, SPACE=32,

  PREC_SEQ=1, PREC_SOME=4, PREC_EVERY=5, PREC_OR=6, PREC_XOR=7, PREC_AND=8,
  PREC_EQ=9, PREC_COMP=10, PREC_SHIFT=11, PREC_SUM=12, PREC_MULT=13, PREC_UNARY=15, PREC_POSTFIX=16, PREC_CALL=18, PREC_GROUP=19


// current string & index
let idx, cur

export const parse = (str, tree) => (cur=str, idx=0, tree=expr(), idx<cur.length ? err() : tree),

err = (msg='Bad syntax') => { throw Error(msg + ' `' + cur[idx] + '` at ' + idx) },

skip = (is=1, from=idx) => {
  if (typeof is === 'number') idx += is
  else while (is(code())) idx++;
  return cur.slice(from, idx)
},

code = (i=0) => cur.charCodeAt(idx+i),

char = (n=1) => cur.substr(idx, n),

// a + b - c
expr = (prec=0, cc=parse.space(), node, i=0, map, newNode) => {
  // FIXME: well, you see these 2 loops are very similar... is there a graceful way to merge them?
  // prefix or token
  while (i < parse.token.length && !(node = lookup[cc]?.(node, prec) || parse.token[i++](cc)));

  // operator
  while (
    (cc=parse.space()) && (map = lookup[cc] || err()) && (newNode = map(node, prec))
  ) node=newNode//if ((node = newNode).indexOf?.(nil) >= 0) err()

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
  (number) => (
    (number = skip(c => (c > 47 && c < 58) || c === PERIOD)) && (
      (code() === 69 || code() === 101) && (number += skip(2) + skip(c => c >= 48 && c <= 57)),
      isNaN(number = new Number(number)) ? err('Bad number') : number
    )
  ),
  // "a"
  (q, qc) => q === 34 && (skip() + skip(c => c-q) + skip()),
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
// @param op is operator string
// @param prec is operator precedenc to check
// @param map is either number +1 - postfix unary, -1 prefix unary, 0 binary, else - custom mapper function
operator = (op, prec=0, type=0, map, c=op.charCodeAt(0), l=op.length, prev=lookup[c], word=op.toUpperCase()!==op, isop) => (
  isop = l<2 ? // word operator must have space after
    !word ? c=>1 : c=>code(1)<=SPACE :
    !word ? c=>char(l)==op : c=>char(l)==op&&code(l)<=SPACE,

  map = !type ? node => { // binary, consume same-op group
      node = [op, node]
      do { idx+=l, node.push(expr(prec)) } while (parse.space()==c && isop())
      return node
    } :
    type > 0 ? node => node && [skip(l), node] : // postfix unary
    type < 0 ? node => !node && [skip(l), expr(prec-1)] : // prefix unary
    type,

  lookup[c] = (node, curPrec) => curPrec < prec && isop() && map(node) || (prev && prev(node, curPrec))
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
  '.', PREC_CALL, (node,b) => node && [skip(),node, typeof (b = expr(PREC_CALL)) === 'string' ? '"' + b + '"' : b],

  // a[b]
  '[', PREC_CALL, (node) => (idx++, node = ['.', node, expr()], idx++, node),
  ']',,,

  // a(b)
  '(', PREC_CALL, (node,b) => ( idx++, b=expr(), idx++,
    Array.isArray(b) && b[0]===',' ? (b[0]=node, b) : b ? [node, b] : [node]
  ),
  // (a+b)
  '(', PREC_GROUP, (node,b) => !node && (++idx, b=expr(), ++idx, b),
  ')',,,
]; i < ops.length;) operator(ops[i++],ops[i++],ops[i++])


export default parse
