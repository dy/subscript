const SPACE=32

// current string & index
let idx, cur

export const parse = (str, tree) => (cur=str, idx=0, tree=expr(), idx<cur.length ? err() : tree || err()),

err = (msg='Bad syntax') => { throw Error(msg + ' `' + cur[idx] + '` at ' + idx) },

skip = (is=1, from=idx, i=0) => {
  if (typeof is === 'number') idx += is
  else if (is.trim) while (code() == is.charCodeAt(i++)) idx++
  // else if (is.trim) {if (cur.substr(idx, is.length) === is) idx+=is.length }
  else while (is(code())) idx++;
  return cur.slice(from, idx)
},

// FIXME: merge into skip
code = () => cur.charCodeAt(idx),
char = (n=1) => cur.substr(idx, n),

// a + b - c
expr = (prec=0, end, cc, node, newNode, op) => {
  // chunk/token parser
  while (
    (cc=parse.space()) && (newNode = (op=lookup[cc]) && op(node, prec) || (!node && (literal(cc) || id(cc) || err())) )
  ) node = newNode;

  // skip end character, if expected
  if (end) cc != end ? err('Unclosed paren') : idx++

  return node
},

// can be extended with comments, so we export
space = parse.space = cc => { while (cc = code(), cc <= SPACE) idx++; return cc },

// literals - static tokens in code (useful for collapsing static expressions)
literals = parse.literal = [],
literal = (c,i=0,node,from=idx) => {
  while(i<literals.length) if (node=literals[i++](c), idx>from) return () => node // 0 args indicate static evaluator
},

// variable identifier
id = (c, v) => (v = skip(c =>
  (c >= 48 && c <= 57) || // 0..9
  (c >= 65 && c <= 90) || // A...Z
  (c >= 97 && c <= 122) || // a...z
  c == 36 || c == 95 || // $, _,
  c >= 192 // any non-ASCII
), ctx => ctx ? ctx[v] : v), // switch to direct id for no-context calls cases (needed for some operators)

// operator lookup table
lookup = [],

// create operator checker/mapper (see examples)
// @param op is operator string
// @param prec is operator precedenc to check
// @param map is either number +1 - postfix unary, -1 prefix unary, 0 binary, else - custom mapper function
operator = parse.operator = (
  op, prec=0, fn, map,
  end=op.map && (op=op[0],operator(op[1])),
  c=op.charCodeAt(0),
  l=op.length,
  prev=fn && lookup[c],
  argc=fn.length
) => (
  map = map ||
    argc > 1 ? // binary
      (a,b) => (
        b=expr(end?0:prec,end),
        !a.length && !b.length ? fn(a(),b()) : // static pre-eval
        ctx => fn(a(ctx),b(ctx))
      ) :
    argc ? a => ctx => fn(a(ctx)) : // unary postfix
    a => (a = expr(end?0:prec-1,end), ctx => fn(a(ctx))), // unary prefix (0 args)

  lookup[c] = (a, curPrec) => (curPrec < prec && (l<2||char(l)==op) && ((a || !argc && !a) && (idx+=l, map(a))) || (prev && prev(a, curPrec) || err())),
  c
)

export default parse
