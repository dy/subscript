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
expr = (prec=0, end, cc, node, newNode, op,x) => {
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
id = parse.id = (c, v) => (v = skip(c =>
  (c >= 48 && c <= 57) || // 0..9
  (c >= 65 && c <= 90) || // A...Z
  (c >= 97 && c <= 122) || // a...z
  c == 36 || c == 95 || // $, _,
  c >= 192 // any non-ASCII
), ctx => ctx ? ctx[v] : v), // return raw id for no-context calls (needed for ops like a.b, a in b, a of b, let a, b)

// operator lookup table
lookup = [],

// create operator checker/mapper (see examples)
operator = parse.operator = (
  op, prec=0, fn=0, map,
  end=op.map && operator(op[1],(op=op[0],0)),
  c=op.charCodeAt(0),
  l=op.length,
  prev=fn && lookup[c],
  argc=fn.length
) => (
  map = argc > 1 ? // binary
      (a,b) => a && ( // a.b needs making sure a exists
        idx+=l,
        b=expr(end?0:prec,end),
        argc > 2 ? ctx => fn(a, b, ctx) : // custom eval logic
        !a.length && !b.length ? (a=fn(a(),b()), ()=>a) : // static pre-eval
        ctx => fn(a(ctx),b(ctx)) // 3 args is extended case when user controls eval
      ) :
    argc ? a => a && (idx+=l, ctx => fn(a(ctx))) : // unary postfix
    a => (!a) && (idx+=l, a = expr(end?0:prec-1,end), ctx => fn(a(ctx))), // unary prefix (0 args)

  // FIXME: check idx+l here /*(a || !argc && !a) && (idx+=l, map(a))*/
  lookup[c] = (a, curPrec) => curPrec < prec && (l<2||char(l)==op) && (map(a)) || (prev && prev(a, curPrec)),
  c
)

export default (s, ...fields) => parse(s.raw ? String.raw(s, ...fields) : s)

