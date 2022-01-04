const SPACE=32

// current string, index and collected ids
export let idx, cur, ids,

parse = (s, ...fields) => !(cur=s.raw ? String.raw(s,...fields) : s, idx=0, ids=[], s=expr()) || cur[idx] ? err('Unexpected end') : ctx=>s(ctx||{}),

isId = c =>
  (c >= 48 && c <= 57) || // 0..9
  (c >= 65 && c <= 90) || // A...Z
  (c >= 97 && c <= 122) || // a...z
  c == 36 || c == 95 || // $, _,
  (c >= 192 && c != 215 && c != 247), // any non-ASCII

err = (msg='Unexpected token',c=cur[idx]) => { throw SyntaxError(msg + ' `' + c + '` at ' + idx) },

skip = (is=1, from=idx, l) => {
  if (typeof is == 'number') idx += is
  else while (is(cur.charCodeAt(idx))) idx++
  return cur.slice(from, idx)
},

// a + b - c
expr = (prec=0, end, cc, token, newNode, fn) => {
  // chunk/token parser
  while (
    ( cc=space() ) && // till not end
    // FIXME: extra work is happening here, when lookup bails out due to lower precedence -
    // it makes extra `space` call for parent exprs on the same character to check precedence again
    ( newNode =
      (fn=lookup[cc]) && fn(token, prec) || // if operator with higher precedence isn't found
      (!token && id()) // parse literal or quit. token seqs are forbidden: `a b`, `a "b"`, `1.32 a`
    )
  ) token = newNode;

  // check end character
  if (end) cc==end?idx++:err('Missing', String.fromCharCode(end))

  return token
},

// skip space chars, return first non-space character
space = cc => { while ((cc = cur.charCodeAt(idx)) <= SPACE) idx++; return cc },

// variable identifier
id = (name=skip(isId), fn) => name ? (fn=ctx => ctx[name], ids.push(name), fn.id=()=>name, fn) : 0,

// operator/token lookup table
lookup = [],

// create operator checker/mapper (see examples)
set = parse.set = (
  op,
  opPrec, fn=SPACE, // if opPrec & fn come in reverse order - consider them raw parse fn case, still precedence possible
  c=op.charCodeAt(0),
  l=op.length,
  prev=lookup[c],
  arity=fn.length || ([fn,opPrec]=[opPrec,fn], 0),
  word=op.toUpperCase()!==op, // make sure word boundary comes after word operator
  map=
    // binary
    arity>1 ? (a,b) => a && (b=expr(opPrec)) && (
      !a.length && !b.length ? (a=fn(a(),b()), ()=>a) : // static pre-eval like `"a"+"b"`
      ctx => fn(a(ctx),b(ctx))
    ) :
    // unary prefix (0 args)
    arity ? a => !a && (a=expr(opPrec-1)) && (ctx => fn(a(ctx))) :
    fn // custom parser
) =>
// FIXME: find out if that's possible to globalize precision and instead of passing it to map, just provide global
lookup[c] = (a, curPrec, from=idx) => curPrec<opPrec && (l<2||cur.substr(idx,l)==op) && (!word||!isId(cur.charCodeAt(idx+l))) && (idx+=l, map(a, curPrec)) || (idx=from, prev&&prev(a, curPrec))
