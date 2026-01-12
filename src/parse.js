import { SPACE } from "./const.js"

// current string, index and collected ids
export let idx, cur,

  // no handling tagged literals since easily done on user side with cache, if needed
  parse = s => (idx = 0, cur = s, s = expr(), cur[idx] ? err() : s || ''),

  // display error with context
  err = (msg = 'Unexpected token',
    lines = cur.slice(0, idx).split('\n'),
    last = lines.pop(),
    before = cur.slice(Math.max(0, idx - 40), idx),
    after = cur.slice(idx, idx + 20)
  ) => {
    throw SyntaxError(`${msg} at ${lines.length + 1}:${last.length + 1} — ${before}^${after}`)
  },

  // advance until condition meets
  next = (is, from = idx, l) => {
    while (l = is(cur.charCodeAt(idx))) idx += l
    return cur.slice(from, idx)
  },

  // advance n characters
  skip = () => cur[idx++],

  // a + b - c
  expr = (prec = 0, end) => {
    let cc, token, newNode, fn

    // chunk/token parser
    while (
      (cc = space()) && // till not end
      // NOTE: when lookup bails on lower precedence, parent expr re-calls space() — acceptable overhead
      (newNode =
        ((fn = lookup[cc]) && fn(token, prec)) ?? // if operator with higher precedence isn't found
        (!token && next(parse.id)) // parse literal or quit. token seqs are forbidden: `a b`, `a "b"`, `1.32 a`
      )
    ) token = newNode;

    // check end character
    if (end) cc == end ? idx++ : err('Unclosed ' + String.fromCharCode(end - (end > 42 ? 2 : 1)))

    return token
  },

  // skip space chars, return first non-space character
  space = cc => { while ((cc = cur.charCodeAt(idx)) <= SPACE) idx++; return cc },

  // parse identifier (configurable)
  id = parse.id = c =>
    (c >= 48 && c <= 57) || // 0..9
    (c >= 65 && c <= 90) || // A...Z
    (c >= 97 && c <= 122) || // a...z
    c == 36 || c == 95 || // $, _,
    (c >= 192 && c != 215 && c != 247), // any non-ASCII

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
  ) => lookup[c] = (a, curPrec, curOp, from = idx) =>
    (
      (curOp ?
        op == curOp :
        ((l < 2 || cur.substr(idx, l) == op) && (curOp = op)) // save matched op to avoid mismatches like `|` as part of `||`
      ) &&
      curPrec < prec && // matches precedence AFTER operator matched
      !(word && parse.id(cur.charCodeAt(idx + l))) && // finished word, not part of bigger word
      (idx += l, map(a) || (idx = from, !prev && err())) // throw if operator didn't detect usage pattern: (a;^b) etc
    ) ||
    prev?.(a, curPrec, curOp),

  // right assoc is indicated by negative precedence (meaning go from right to left)
  binary = (op, prec, right = false) => token(op, prec, (a, b) => a && (b = expr(prec - (right ? .5 : 0))) && [op, a, b]),

  // post indicates postfix rather than prefix operator
  unary = (op, prec, post) => token(op, prec, a => post ? (a && [op, a]) : (!a && (a = expr(prec - .5)) && [op, a])),

  // NOTE: allows ;;; (valid empty statements) and ,,, (debatable but harmless)
  nary = (op, prec, skips) => {
    token(op, prec,
      (a, b) => (
        b = expr(prec),
        (
          (a?.[0] !== op) && (a = [op, a || null]), // if beginning of sequence - init node
          b?.[0] === op ? a.push(...b.slice(1)) : a.push(b || null), // comments can return same-token expr
          a
        ))
    )
  },

  // register (a), [b], {c} etc groups
  group = (op, prec) => token(op[0], prec, a => (!a && [op, expr(0, op.charCodeAt(1))])),

  // register a(b), a[b], a<b> etc,
  // NOTE: we make sure `null` indicates placeholder
  access = (op, prec) => token(op[0], prec, a => (a && [op, a, expr(0, op.charCodeAt(1)) || null]))


export default parse
