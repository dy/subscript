const SPACE=32

// current string & index
export let idx, cur,

parse = (s, ...fields) => (cur=s.raw ? String.raw(s,...fields) : s, idx=0, !(s=expr())||cur[idx] ? err() : ctx=>s(ctx||{})),

isId = c =>
  (c >= 48 && c <= 57) || // 0..9
  (c >= 65 && c <= 90) || // A...Z
  (c >= 97 && c <= 122) || // a...z
  c == 36 || c == 95 || // $, _,
  (c >= 192 && c != 215 && c != 247), // any non-ASCII

err = (msg='Bad syntax') => { throw Error(msg + ' `' + cur[idx] + '` at ' + idx) },

skip = (is=1, from=idx, l) => {
  if (typeof is == 'number') idx += is
  else while (is(code())) idx++

  return cur.slice(from, idx)
},

// FIXME: instead of code try storing last global code
code = (i=0) => cur.charCodeAt(idx+i),
char = (n=1) => cur.substr(idx, n),

// a + b - c
expr = (prec=0, cc, token, newNode, fn) => {
  // chunk/token parser
  while (
    (cc=parse.space()) && // till not end
    ( newNode =
      (fn=lookup[cc]) ? fn(token, prec) : // if operator with higher precedence isn't found
      !token && id() // parse literal or quit. token seqs are forbidden: `a b`, `a "b"`, `1.32 a`
    )
  ) token = newNode;

  // skip end character, if expected
  // if (end) cc != end ? err('Unclosed paren') : idx++

  return token
},

// can be extended with comments, so we expose
// FIXME: ideally make via lookup as well or... maybe expose comment entries still and make not exportable
space = parse.space = cc => { while ((cc = code()) <= SPACE) idx++; return cc },

// variable identifier
id = (name=skip(isId)) => name ? ctx => ctx[name] : 0,

// operator/token lookup table
lookup = [],

// create operator checker/mapper (see examples)
operator = parse.operator = (
  op, prec=0, fn=0,
  c=op.charCodeAt(0),
  l=op.length,
  prev=lookup[c],
  arity=fn.length,
  word=op.toUpperCase()!==op, // make sure word break comes after word operator
  map=
    // binary
    arity > 1 ? (a,b) => a &&
      (
        idx+=l, b=expr(prec),
        !a.length && !b.length ? (a=fn(a(),b()), ()=>a) : // static pre-eval like `"a"+"b"`
        ctx => fn(a(ctx),b(ctx))
      )
    :
    // unary postfix
    arity ? a => a && ( idx+=l, ctx => fn(a(ctx))) :
    // unary prefix (0 args)
    a => !a && ( idx+=l, a=expr(prec-1)) && (ctx => fn(a(ctx)))
) =>
lookup[c] = (a, curPrec) => curPrec < prec && (l<2||char(l)==op) && (!word||!isId(code(l))) && map(a) || (prev && prev(a, curPrec))

// accound for template literals
export default parse

