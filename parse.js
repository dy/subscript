const SPACE=32

// current string & index
let idx, cur

export const parse = (str, tree) => (cur=str, idx=0, tree=expr(), idx<cur.length ? err() : val(tree)),

err = (msg='Bad syntax') => { throw Error(msg + ' `' + cur[idx] + '` at ' + idx) },

skip = (is=1, from=idx) => {
  if (typeof is === 'number') idx += is
  else while (is(code())) idx++;
  return cur.slice(from, idx)
},

code = (i=0) => cur.charCodeAt(idx+i),

char = (n=1) => cur.substr(idx, n),

// a + b - c
expr = (prec=0, end, cc, node, i=0, newNode, op) => {
  // chunk/token parser
  while (
    (cc=parse.space()) && (newNode = (op=lookup[cc]) && op(node, prec) || (!node && token(cc)) )
  ) node = newNode;

  // skip end character, if expected
  if (end) cc != end ? err('Unclosed paren') : idx++

  return node
},

// can be extended with comments, so we export
space = parse.space = cc => { while (cc = code(), cc <= SPACE) idx++; return cc },

// tokens
tokens = parse.token = [],
token = (c,i=0,node) => { while(i<tokens.length) if (node = tokens[i++](c)) return node },

// operator lookup table
lookup = [],

// create operator checker/mapper (see examples)
// @param op is operator string
// @param prec is operator precedenc to check
// @param map is either number +1 - postfix unary, -1 prefix unary, 0 binary, else - custom mapper function
operator = parse.operator = (
  op, prec=0, type=0, map, c=op.charCodeAt(0), l=op.length, prev=lookup[c]
) => (
  map = !type ? node => { // binary
      node = [op, val(node)]
      do { idx+=l, node.push(val(expr(prec))) } // consume same-op group
      while (parse.space()==c && (l<2||char(l)==op))
      return node
    } :
    type > 0 ? node => node && [skip(l), val(node)] : // postfix unary
    type < 0 ? node => !node && [skip(l), val(expr(prec-1))] : // prefix unary
    type,

  lookup[c] = (node, curPrec) =>
    curPrec < prec && (l<2||char(l)==op) && map(node) || (prev && prev(node, curPrec))
),

// in order to support literal tokens, we call valueOf any time we create or modify calltree node
val = node => Array.isArray(node) ? node : (node || err()).valueOf()

export default parse
