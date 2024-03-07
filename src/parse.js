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
    throw EvalError(`${msg} at ${lines.length}:${last.length} \`${idx >= 108 ? '…' : ''}${before}┃${after}\``, 'font-weight: bold')
  },

  // advance until condition meets
  next = (is, from = idx, l) => {
    while (l = is(cur.charCodeAt(idx))) idx += l
    return cur.slice(from, idx)
  },

  // consume n characters
  skip = (n = 1, from = idx) => (idx += n, cur.slice(from, idx)),

  // a + b - c
  expr = (prec = 0, end, cc, token, newNode, fn) => {
    // chunk/token parser
    while (
      (cc = parse.space()) && // till not end
      // FIXME: extra work is happening here, when lookup bails out due to lower precedence -
      // it makes extra `space` call for parent exprs on the same character to check precedence again
      (newNode =
        ((fn = lookup[cc]) && fn(token, prec)) ?? // if operator with higher precedence isn't found
        (!token && next(parse.id)) // parse literal or quit. token seqs are forbidden: `a b`, `a "b"`, `1.32 a`
      )
    ) token = newNode;

    // check end character
    if (end) cc == end ? idx++ : err()

    return token
  },

  // parse identifier (configurable)
  id = parse.id = c =>
    (c >= 48 && c <= 57) || // 0..9
    (c >= 65 && c <= 90) || // A...Z
    (c >= 97 && c <= 122) || // a...z
    c == 36 || c == 95 || // $, _,
    (c >= 192 && c != 215 && c != 247), // any non-ASCII

  // skip space chars, return first non-space character
  space = parse.space = cc => { while ((cc = cur.charCodeAt(idx)) <= SPACE) idx++; return cc },

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
    (curPrec < prec && (l < 2 || cur.substr(idx, l) == op) && (!word || !parse.id(cur.charCodeAt(idx + l))) && (idx += l, map(a, curPrec))) ||
    (idx = from, prev?.(a, curPrec)),

  // right assoc is indicated by negative precedence (meaning go from right to left)
  binary = (op, prec, right = false) => token(op, prec, (a, b) => a && (b = expr(prec - (right ? .5 : 0))) && [op, a, b]),

  // post indicates postfix rather than prefix operator
  unary = (op, prec, post) => token(op, prec, a => post ? (a && [op, a]) : (!a && (a = expr(prec - .5)) && [op, a])),

  // skips means ,,, ;;; are allowed
  nary = (op, prec) => {
    token(op, prec, (a, b) => (
      (b = expr(prec)),
      (
        (!a || a[0] !== op) && (a = [op, a]), // if beginning of sequence - init node
        a.push(b),
        a
      ))
    )
  },

  // register (a), [b], {c} etc groups
  // FIXME: add "Unclosed paren" error
  group = (op, prec) => token(op[0], prec, a => (!a && ([op, expr(0, op.charCodeAt(1))]))),

  // register a(b), a[b], a<b> etc,
  access = (op, prec) => token(op[0], prec, a => (a && [op[0], a, expr(0, op.charCodeAt(1))]))


export default parse
