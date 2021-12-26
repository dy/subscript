const SPACE=32

// current string & index
export let idx, cur,

parse = (s, ...fields) => !(cur=s.raw ? String.raw(s,...fields) : s, idx=0, s=expr()) || cur[idx] ? err() : ctx=>s(ctx||{}),

isId = c =>
  (c >= 48 && c <= 57) || // 0..9
  (c >= 65 && c <= 90) || // A...Z
  (c >= 97 && c <= 122) || // a...z
  c == 36 || c == 95 || // $, _,
  (c >= 192 && c != 215 && c != 247), // any non-ASCII

err = (msg='Bad syntax',c=cur[idx]) => { throw Error(msg + ' `' + c + '` at ' + idx) },
len = a=>a.length,

skip = (is=1, from=idx, l) => {
  if (typeof is == 'number') idx += is
  else while (is(code())) idx++
  return cur.slice(from, idx)
},
code = (i=0) => cur.charCodeAt(idx+i),

// a + b - c
expr = (prec=0, end, cc, token, newNode, fn) => {
  // chunk/token parser
  while (
    ( cc=space() ) && // till not end
    ( newNode =
      (fn=lookup[cc]) && fn(token, prec) || // if operator with higher precedence isn't found
      (!token && id()) // parse literal or quit. token seqs are forbidden: `a b`, `a "b"`, `1.32 a`
    )
  ) token = newNode;

  // check end character
  if (end) cc==end?idx++:err('Unclosed')

  return token
},

// we don't export space, since comments can be organized via custom parsers
space = cc => { while ((cc = code()) <= SPACE) idx++; return cc },

// variable identifier
id = (name=skip(isId), fn) => name ? (fn=ctx => ctx[name], fn.id=()=>name, fn) : 0,

// operator/token lookup table
lookup = [],

// create operator checker/mapper (see examples)
set = parse.set = (
  op, prec, fn,
  c=op.charCodeAt(0),
  l=len(op),
  prev=lookup[c],
  arity=fn&&len(fn),
  word=op.toUpperCase()!==op, // make sure word break comes after word operator
  map=!prec ? fn : // custom parser
    // binary
    arity>1 ? (a,b) => a && (b=expr(prec)) && (
      !len(a) && !len(b) ? (a=fn(a(),b()), ()=>a) : // static pre-eval like `"a"+"b"`
      ctx => fn(a(ctx),b(ctx))
    ) :
    // NOTE: due to rarity and simplicity of postfix ops we consider them custom op and ignore generic init
    // unary prefix (0 args)
    a => !a && (a=expr(prec-1)) && (ctx => fn(a(ctx)))
) =>

lookup[c] = (a, curPrec, from=idx) => (curPrec<prec||!prec) && (l<2||cur.substr(idx,l)==op) && (!word||!isId(code(l))) &&
  (idx+=l, map(a)) || (idx=from, prev&&prev(a, curPrec))


