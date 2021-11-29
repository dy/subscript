const SPACE=32

// current string & index
let idx, cur

export const parse = (str, tree) => (cur=str, idx=0, tree=expr(), idx<cur.length ? err() : tree.valueOf()),

err = (msg='Bad syntax') => { throw Error(msg + ' `' + cur[idx] + '` at ' + idx) },

skip = (is=1, from=idx) => {
  if (typeof is === 'number') idx += is
  else while (is(code())) idx++;
  return cur.slice(from, idx)
},

code = (i=0) => cur.charCodeAt(idx+i),

char = (n=1) => cur.substr(idx, n),

// a + b - c
expr = (prec=0, end, cc, node, i=0, map, newNode) => {
  // chunk/token parser
  while (
    (cc=parse.space()) && (newNode = lookup[cc]?.(node, prec) || (!node && token(cc)) )
  ) node = newNode;

  if (end && cc !== end) err('Unclosed paren')

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
operator = parse.operator =  (op, prec=0, type=0, map, c=op.charCodeAt(0), l=op.length, prev=lookup[c], word=op.toUpperCase()!==op, isop) => (
  isop = l<2 ? // word operator must have space after
    !word ? c=>1 : c=>code(1)<=SPACE :
    !word ? c=>char(l)==op : c=>char(l)==op&&code(l)<=SPACE,

  map = !type ? node => { // binary, consume same-op group
      node = [op, node || err()]
      // in order to support literal tokens, we call valueOf any time we create or modify calltree node
      do { idx+=l, node.push((expr(prec) || err()).valueOf()) } while (parse.space()==c && isop())
      return node
    } :
    type > 0 ? node => node && [skip(l), node] : // postfix unary
    type < 0 ? node => !node && [skip(l), (expr(prec-1) || err()).valueOf()] : // prefix unary
    type,

  lookup[c] = (node, curPrec) => curPrec < prec && isop() && map(node) || (prev && prev(node, curPrec))
)

export default parse
