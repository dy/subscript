import { SPACE } from "./const.js"

// current string, index and collected ids
export let idx, cur,

  // no handling tagged literals since easily done on user side with cache, if needed
  parse = s => (idx = 0, cur = s, s = expr(), cur[idx] ? err() : s || ''),

  err = (msg = 'Bad syntax',
    lines = cur.slice(0, idx).split('\n'),
    last = lines.pop()
  ) => {
    let before = cur.slice(idx - 108, idx).split('\n').pop()
    let after = cur.slice(idx, idx + 108).split('\n').shift()
    throw EvalError(`${msg} at ${lines.length}:${last.length} \`${before + after}\``, 'font-weight: bold')
  },

  skip = (is = 1, from = idx, l) => {
    if (typeof is == 'number') idx += is
    else while (l = is(cur.charCodeAt(idx))) idx += l
    return cur.slice(from, idx)
  },

  // a + b - c
  expr = (prec = 0, end, cc, token, newNode, fn) => {
    // chunk/token parser
    while (
      (cc = parse.space()) && // till not end
      // FIXME: extra work is happening here, when lookup bails out due to lower precedence -
      // it makes extra `space` call for parent exprs on the same character to check precedence again
      (newNode =
        ((fn = lookup[cc]) && fn(token, prec)) ?? // if operator with higher precedence isn't found
        (!token && parse.id()) // parse literal or quit. token seqs are forbidden: `a b`, `a "b"`, `1.32 a`
      )
    ) token = newNode;

    // check end character
    // FIXME: can't show "Unclosed paren", because can be unknown operator within group as well
    if (end) cc == end ? idx++ : err()

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
    prec = SPACE,
    map,
    c = op.charCodeAt(0),
    l = op.length,
    prev = lookup[c],
    word = op.toUpperCase() !== op // make sure word boundary comes after word operator
  ) => lookup[c] = (a, curPrec, from = idx) =>
    (curPrec < prec && (l < 2 || cur.substr(idx, l) == op) && (!word || !isId(cur.charCodeAt(idx + l))) && (idx += l, map(a, curPrec))) ||
    (idx = from, prev?.(a, curPrec)),

  // right assoc is indicated by negative precedence (meaning go from right to left)
  binary = (op, prec, right = 0) => token(op, prec, (a, b) => a && (b = expr(prec - right / 2)) && [op, a, b]),

  // post indicates postfix rather than prefix operator
  unary = (op, prec, post) => token(op, prec, a => post ? (a && [op, a]) : (!a && (a = expr(prec - .5)) && [op, a])),

  // skips means ,,, ;;; are allowed
  nary = (op, prec, skips) => {
    token(op, prec, (a, b) => (
      (a || skips) && // if lhs exists or we're ok to skip
      (b = expr(prec), b || skips) && // either rhs exists or we're ok to skip rhs
      (
        (!a || a[0] !== op) && (a = [op, a]), // if beginning of sequence - init node
        (b || skips) && a.push(b),
        a
      ))
    )
  }

export default parse
