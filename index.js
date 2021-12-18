const SPACE=32

// current string & index
export let idx, cur,

parse = (s, ...fields) => (cur=s.raw ? String.raw(s,...fields) : s, idx=0, !(s=expr())||idx<cur.length ? err() : ctx=>s(ctx||{})),

isId = c =>
  (c >= 48 && c <= 57) || // 0..9
  (c >= 65 && c <= 90) || // A...Z
  (c >= 97 && c <= 122) || // a...z
  c == 36 || c == 95 || // $, _,
  (c >= 192 && c != 215 && c != 247), // any non-ASCII

err = (msg='Bad syntax') => { throw Error(msg + ' `' + cur[idx] + '` at ' + idx) },

skip = (is=1, from=idx, l) => {
  if (typeof is == 'number') idx += is
  else if (l = is.trim && is.length) idx+=char(l)==is?l:0
  else while (is(code())) idx++

  return cur.slice(from, idx)
},

// FIXME: merge into skip
code = (i=0) => cur.charCodeAt(idx+i),
char = (n=1) => cur.substr(idx, n),

// a + b - c
expr = (prec=0, end, cc, node, newNode, op,x) => {
  // chunk/token parser
  while (
    (cc=parse.space()) && (newNode = (op=lookup[cc]) && op(node, prec) || (!node && (lit(cc) || id(cc) || err())) )
  ) node = newNode;

  // skip end character, if expected
  if (end) cc != end ? err('Unclosed paren') : idx++

  return node
},

// can be extended with comments, so we export
space = parse.space = cc => { while (cc = code(), cc <= SPACE) idx++; return cc },

// literals - static tokens in code (useful for collapsing static expressions)
literal = parse.literal = [],
lit = (c,i=0,node,from=idx) => {
  while(i<literal.length) if (node=literal[i++](c), idx>from) return () => node // 0 args indicate static evaluator
},

// variable identifier
// returns raw id for no-context calls (needed for ops like a.b, a in b, a of b, let a, b)
id = parse.id = (c, v=skip(isId)) => !v ? ()=>nil : (ctx => ctx ? ctx[v] : v),

// operator lookup table
lookup = [],

// create operator checker/mapper (see examples)
operator = parse.operator = (
  op, prec=0, fn=0, map,
  end=op.map && operator(op[1],(op=op[0],0)),
  c=op.charCodeAt(0),
  l=op.length,
  prev=fn && lookup[c],
  argc=fn.length,
  word=op.toUpperCase()!==op // make sure word break comes after word operator
) => (
  map = argc > 1 ? // binary
      (a,b) => a && ( // a.b needs making sure `a` exists (since 1.0 can also be a token) - generally binary is not the last stop
        idx+=l,
        b=expr(end?0:prec,end),
        argc > 2 ? ctx => fn(a, b, ctx) : // custom eval logic
        !a.length && !b.length ? (a=fn(a(),b()), ()=>a) : // static pre-eval
        ctx => fn(a(ctx),b(ctx)) // 3 args is extended case when user controls eval
      ) :
    argc ? a => a && (idx+=l, ctx => fn(a(ctx))) : // unary postfix
    a => (!a) && ( idx+=l, a = expr(end?0:prec-1,end), ctx => fn(a(ctx))), // unary prefix (0 args)

  // FIXME: check idx+l here /*(a || !argc && !a) && (idx+=l, map(a))*/
  lookup[c] = (a, curPrec) => curPrec < prec && (l<2||char(l)==op) && (!word||!isId(code(l))) && map(a) || (prev && prev(a, curPrec)),
  c
),
Seq = class extends Array {},
nil = new Seq,
seq = a => a instanceof Seq ? a : Seq.from([a]) // for arguments in fn call, array primitive etc.

// accound for template literals
export default parse

