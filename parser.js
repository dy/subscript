const SPACE=32, CPAREN=41, PERIOD=46, _0=48, _9=57

// current string, index and collected ids
export let idx, cur, args,

// no handling tagged literals since easily done on user side with cache, if needed
parse = (s, fn) => (
  idx=0, args=[], cur=s.trim(),
  !(s = cur ? expr() : ctx=>{}) || cur[idx] ? err() :
  fn = ctx=>s(ctx||{}), fn.args = args, fn
),

isId = c =>
  (c >= 48 && c <= 57) || // 0..9
  (c >= 65 && c <= 90) || // A...Z
  (c >= 97 && c <= 122) || // a...z
  c == 36 || c == 95 || // $, _,
  (c >= 192 && c != 215 && c != 247), // any non-ASCII

err = (msg='Bad syntax',c=cur[idx]) => { throw SyntaxError(msg + ' `' + c + '` at ' + idx) },

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
  // FIXME: can't show "Unclose paren", because can be unknown operator within group as well
  if (end) cc==end?idx++:err()

  return token
},

// skip space chars, return first non-space character
space = cc => { while ((cc = cur.charCodeAt(idx)) <= SPACE) idx++; return cc },

// variable identifier
id = (name=skip(isId), fn) => name ? (fn=ctx => ctx[name], args.push(name), fn.id=()=>name, fn) : 0,

// operator/token lookup table
lookup = [],

// create operator checker/mapper (see examples)
token = (
  op, map,
  prec=SPACE,
  c=op.charCodeAt(0),
  l=op.length,
  prev=lookup[c],
  word=op.toUpperCase()!==op // make sure word boundary comes after word operator
) => lookup[c] = (a, curPrec, from=idx) =>
  curPrec<prec && (l<2||cur.substr(idx,l)==op) && (!word||!isId(cur.charCodeAt(idx+l))) && (idx+=l, map(a, curPrec)) ||
  (idx=from, prev&&prev(a, curPrec)),


// numbers
isNum = c => c>=_0 && c<=_9,

// 1.2e+3, .5
num = n => (
  n&&err('Unexpected number'),
  n = skip(c=>c == PERIOD || isNum(c)),
  (cur.charCodeAt(idx) == 69 || cur.charCodeAt(idx) == 101) && (n += skip(2) + skip(isNum)),
  n=+n, n!=n ? err('Bad number') : () => n // 0 args means token is static
)

for (let op=_0;op<=_9;) lookup[op++] = num
lookup[PERIOD] = a => (idx&&idx--,num())
