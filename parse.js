const SPACE=32

// current string, index and collected ids
export let idx, cur,

// no handling tagged literals since easily done on user side with cache, if needed
parse = s => (idx=0, cur=s, s = expr(), cur[idx] ? err() : s || ''),

err = (msg='Bad syntax', frag=cur[idx], prev=cur.slice(0,idx).split('\n'), last=prev.pop()) => {
  throw SyntaxError(`${msg} \`${frag}\` at ${prev.length}:${last.length}`)
},

longErr = (msg='Bad syntax',
  frag=cur[idx],
  lines=cur.slice(0,idx).split('\n'),
  last=lines.pop()
) => {
  let before = cur.slice(idx-10,idx).split('\n').pop()
  let after = cur.slice(idx+1, idx+10).split('\n').shift()
  let location = lines.length + ':' + last.length
  throw SyntaxError(`${msg} at ${location} \`${before+frag+after}\`\n${' '.repeat(18 + msg.length + location.length + before.length + 1)}^`)
},

skip = (is=1, from=idx, l) => {
  if (typeof is == 'number') idx += is
  else while (l=is(cur.charCodeAt(idx))) idx+=l
  return cur.slice(from, idx)
},

// a + b - c
expr = (prec=0, end, cc, token, newNode, fn) => {
  // chunk/token parser
  while (
    ( cc=parse.space() ) && // till not end
    // FIXME: extra work is happening here, when lookup bails out due to lower precedence -
    // it makes extra `space` call for parent exprs on the same character to check precedence again
    (newNode =
      ((fn=lookup[cc]) && fn(token, prec)) ?? // if operator with higher precedence isn't found
      (!token && parse.id()) // parse literal or quit. token seqs are forbidden: `a b`, `a "b"`, `1.32 a`
    )
  ) token = newNode;

  // check end character
  // FIXME: can't show "Unclose paren", because can be unknown operator within group as well
  if (end) cc==end?idx++:err()

  return token
},

isId = c =>
  (c >= 48 && c <= 57) || // 0..9
  (c >= 65 && c <= 90) || // A...Z
  (c >= 97 && c <= 122) || // a...z
  c == 36 || c == 95 || // $, _,
  (c >= 192 && c != 215 && c != 247), // any non-ASCII

// skip space chars, return first non-space character
space = parse.space = cc => { while ((cc = cur.charCodeAt(idx)) <= SPACE) idx++; return cc },

id = parse.id = n => skip(isId),

// operator/token lookup table
// lookup[0] is id parser to let configs redefine it
lookup = [],


// create operator checker/mapper (see examples)
token = (
  op,
  prec=SPACE,
  map,
  c=op.charCodeAt(0),
  l=op.length,
  prev=lookup[c],
  word=op.toUpperCase()!==op // make sure word boundary comes after word operator
) => lookup[c] = (a, curPrec, from=idx) =>
  (curPrec<prec && (l<2||cur.substr(idx,l)==op) && (!word||!isId(cur.charCodeAt(idx+l))) && (idx+=l, map(a, curPrec))) ||
  (idx=from, prev?.(a, curPrec)),

// right assoc is indicated by negative precedence (meaning go from right to left)
binary = (op, prec, right) => token(op, prec, (a, b) => a && (b=expr(prec-!!right)) && [op,a,b] ),
unary = (op, prec, post) => token(op, prec, a => post ? (a && [op, a]) : (!a && (a=expr(prec-1)) && [op, a])),
nary = (op, prec, skips) => token(op, prec, (a, b) => a && (b=expr(prec),b||skips) && (a[0] === op && a[2] ? (b&&a.push(b), a) : [op,a,b]))

export default parse
