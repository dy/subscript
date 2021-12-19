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
expr = (prec=0, end, cc, node, newNode, op) => {
  // chunk/token parser
  while (
    (cc=parse.space()) && (
      newNode = (op=lookup[cc]) && op(node, prec) || // if operator with higher precedence isn't found
      (!node && (lit(cc) || id(cc))) // parse literal or quit -  token seqs are prohibited: `a b`, `a "b"`, `1.32 a`
    )
  ) node = newNode;

  // skip end character, if expected
  if (end) cc != end ? err('Unclosed paren') : idx++

  return node
},

// can be extended with comments, so we expose
space = parse.space = cc => { while (cc = code(), cc <= SPACE) idx++; return cc },

// literals - static tokens in code (useful for collapsing static expressions)
literal = parse.literal = [],
lit = (c,i=0,node,from=idx) => {
  while(i<literal.length) if (node=literal[i++](c), idx>from) return () => node // 0 args indicate static evaluator
},

// variable identifier
id = (c, id=skip(isId), v) => id && ((v=ctx=>ctx[id]).id=id, v),

// operator lookup table
lookup = [],

// create operator checker/mapper (see examples)
operator = parse.operator = (
  op, prec=0, fn=0, map,
  end=op.map && operator(op[1],(op=op[0],0)),
  c=op.charCodeAt(0),
  l=op.length,
  prev=fn && lookup[c],
  arity=fn.length,
  multi=/\.{3}\w+\)/.test(fn), // if b is a sequence
  word=op.toUpperCase()!==op // make sure word break comes after word operator
) => (
  map = arity > 1 ? // binary
    (a,b) => a && // `a` must exist (.0 can be a token → a.b should not block it) - generally binary is not the last stop
      (idx+=l, b=expr(end?0:prec,end)) && // b is not empty
      (
        !a.length && !b.length ? (a=fn(a(),b(),a.id,b.id), ()=>a) : // static pre-eval
        ctx => fn(a(ctx),b(ctx),a.id,b.id) // 3 args is extended case when user controls eval
      ) :
    arity ? a => a && (idx+=l, ctx => fn(a(ctx),a.id)) : // unary postfix
    a => !a && ( idx+=l, a = expr(end?0:prec-1,end), ctx => fn(a(ctx),a.id)), // unary prefix (0 args)

  // FIXME: check idx+l here /*(a || !argc && !a) && (idx+=l, map(a))*/
  lookup[c] = (a, curPrec) => curPrec < prec && (l<2||char(l)==op) && (!word||!isId(code(l))) && map(a) || (prev && prev(a, curPrec)),
  c
)

// accound for template literals
export default parse

