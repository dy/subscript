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
  // NOTE: nice clause, but not fast enough
  // else if (cur.startsWith(is, idx)) idx += is.length

  return cur.slice(from, idx)
},
code = (i=0) => cur.charCodeAt(idx+i),

// a + b - c
expr = (prec=0, cc, token, newNode, fn) => {
  // chunk/token parser
  while (
    (cc=space()) && // till not end
    ( newNode =
      (fn=lookup[cc]) && fn(token, prec) || // if operator with higher precedence isn't found
      (!token && id()) // parse literal or quit. token seqs are forbidden: `a b`, `a "b"`, `1.32 a`
    )
  ) token = newNode;

  // skip end character, if expected
  // if (end) cc != end ? err('Unclosed paren') : idx++

  return token
},

// we don't export space, since comments can be organized via custom parsers
space = cc => { while ((cc = code()) <= SPACE) idx++; return cc },

// variable identifier
id = (name=skip(isId)) => name ? ctx => ctx?ctx[name]:name : 0,

// operator/token lookup table
lookup = [],

// create operator checker/mapper (see examples)
set = parse.set = (
  op, prec, fn=0,
  c=op.charCodeAt(0),
  l=op.length,
  prev=lookup[c],
  arity=fn&&fn.length,
  word=op.toUpperCase()!==op, // make sure word break comes after word operator
  map=!prec ? fn : // custom parser
    // binary
    arity > 1 ? (a,b) => a &&
      (
        b=expr(prec),
        !a.length && !b.length ? (a=fn(a(),b()), ()=>a) : // static pre-eval like `"a"+"b"`
        ctx => fn(a(ctx),b(ctx))
      )
    :
    // unary postfix
    arity ? a => a && ( ctx => fn(a(ctx))) :
    // unary prefix (0 args)
    a => !a && ( a=expr(prec-1)) && (ctx => fn(a(ctx)))
) =>
// FIXME: try skiping operator here: it is literally first thing everythere
lookup[c] = (a, curPrec, from=idx) => (curPrec<prec||!prec) && (l<2||cur.substr(idx,l)==op) && (!word||!isId(code(l))) &&
  (idx+=l, map(a)) || (idx=from, prev&&prev(a, curPrec))

// accound for template literals
export default parse

