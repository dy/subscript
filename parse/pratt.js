// Character codes
const SPACE = 32;

// current string, index
export let idx, cur,

  // no handling tagged literals since easily done on user side with cache, if needed
  parse = s => (idx = 0, cur = s, parse.newline = false, s = expr(), cur[idx] ? err() : s || ''),

  // display error with context
  // err.ptr: string suffix (combining diacritics) or [before, after] wrapper
  err = (msg = 'Unexpected token', at = idx,
    lines = cur.slice(0, at).split('\n'),
    last = lines.pop(),
    before = cur.slice(Math.max(0, at - 40), at),
    ptr = '\u032D',//'\u030C\u032D',
    chr = (cur[at] || '∅') + ptr,
    after = cur.slice(at + 1, at + 20)
  ) => {
    throw SyntaxError(`${msg} at ${lines.length + 1}:${last.length + 1} — ${before}${chr}${after}`)
  },

  // attach location to node (returns node for chaining)
  loc = (node, at = idx) => (Array.isArray(node) && (node.loc = at), node),

  // advance until condition meets
  next = (is, from = idx, l) => {
    while (l = is(cur.charCodeAt(idx))) idx += l;
    return cur.slice(from, idx);
  },

  // advance n characters
  skip = (n=1) => cur[idx+=n],

  // set position (for backtracking)
  seek = n => idx = n,

  // end character for current expr scope (propagated through nested calls)
  endChar = 0,

  // a + b - c
  expr = (prec = 0, end) => {
    let cc, token, newNode, fn, prevEnd = endChar, prevReserved = parse.reserved, nl;
    if (end) endChar = end, parse.asi && (parse.newline = false); // new scope resets newline
    parse.reserved = 0;

    // chunk/token parser
    while (
      (cc = parse.space()) && // till not end (resets parse.newline, may set again)
      (nl = parse.newline, 1) && // capture newline state AFTER space() scanned
      cc !== endChar &&  // stop at end char
      // NOTE: when lookup bails on lower precedence, parent expr re-calls space() — acceptable overhead
      (newNode =
        ((fn = lookup[cc]) && fn(token, prec)) ?? // operator with higher precedence
        (parse.asi && token && nl && (newNode = parse.asi(token, prec, expr))) ?? // ASI hook
        (!token && !parse.reserved && next(parse.id)) // parse literal or quit (skip reserved words)
      )
    ) token = newNode, parse.reserved = 0;
    parse.reserved = prevReserved;

    // check end character - only if we set it (not inherited)
    if (end) cc == end ? idx++ : err('Unclosed ' + String.fromCharCode(end - (end > 42 ? 2 : 1)));
    endChar = prevEnd;

    return token;
  },

  // skip space chars, return first non-space character (configurable via parse.space)
  // Sets parse.newline = true if newline crossed (only when parse.asi is set)
  // Flag accumulates until explicitly reset
  space = parse.space = (cc, from = idx) => {
    while ((cc = cur.charCodeAt(idx)) <= SPACE) {
      if (parse.asi && cc === 10) parse.newline = true
      idx++
    }
    return cc
  },

  // is char an id? (configurable via parse.id)
  id = parse.id = c =>
    (c >= 48 && c <= 57) || // 0..9
    (c >= 65 && c <= 90) || // A...Z
    (c >= 97 && c <= 122) || // a...z
    c == 36 || c == 95 || // $, _,
    (c >= 192 && c != 215 && c != 247), // any non-ASCII

  // check if word matches at current position (word boundary enforced)
  word = (w, l = w.length) => cur.substr(idx, l) === w && !parse.id(cur.charCodeAt(idx + l)),

  // parse (...) group - assumes ( is current char
  parens = () => (skip(), expr(0, 41)),

  // operator/token lookup table
  // lookup[0] is id parser to let configs redefine it
  lookup = [],


  // create operator checker/mapper (see examples)
  // map returns: truthy = result, undefined = reserved word, false = fall through (not reserved)
  // attaches .loc to array results for source mapping
  token = (
    op,
    prec = SPACE,
    map,
    c = op.charCodeAt(0),
    l = op.length,
    prev = lookup[c],
    word = op.toUpperCase() !== op, // make sure word boundary comes after word operator
    matched, r // track if we matched (for curOp propagation)
  ) => lookup[c] = (a, curPrec, curOp, from = idx) =>
    (matched = curOp, // reset matched to curOp at start (prevents closure leak)
      (curOp ?
        op == curOp :
        (l < 2 || cur.substr(idx, l) == op) && (!word || !parse.id(cur.charCodeAt(idx + l))) && (matched = curOp = op) // save matched only after boundary check
      ) &&
      curPrec < prec && // matches precedence AFTER operator matched
      (idx += l, (r = map(a)) ? loc(r, from) : (idx = from, matched = 0, word && r !== false && (parse.reserved = 1), !word && !prev && err()), r) // false = fall through without reserved
    ) ||
    prev?.(a, curPrec, matched), // pass matched through chain

  // right assoc is indicated by negative precedence (meaning go from right to left)
  binary = (op, prec, right = false) => token(op, prec, (a, b) => a && (b = expr(prec - (right ? .5 : 0))) && [op, a, b]),

  // post indicates postfix rather than prefix operator
  unary = (op, prec, post) => token(op, prec, a => post ? (a && [op, a]) : (!a && (a = expr(prec - .5)) && [op, a])),

  // literal keyword: null, undefined, true, false, NaN, Infinity
  literal = (op, val) => token(op, 200, a => !a && [, val]),

  // NOTE: allows ;;; (valid empty statements) and ,,, (debatable but harmless)
  // right=true allows same-precedence tokens on RHS (like statements after semicolon)
  nary = (op, prec, right) => {
    token(op, prec,
      (a, b) => (
        b = expr(prec - (right ? .5 : 0)),  // endChar is already set, just stop at it
        (
          (a?.[0] !== op) && (a = [op, a || null]), // if beginning of sequence - init node
          b?.[0] === op ? a.push(...b.slice(1)) : a.push(b || null), // comments can return same-token expr
          a
        ))
    )
  },

  // register (a), [b], {c} etc groups
  group = (op, prec) => token(op[0], prec, a => (!a && [op, expr(0, op.charCodeAt(1)) || null])),

  // register a(b), a[b], a<b> etc,
  // NOTE: we make sure `null` indicates placeholder
  access = (op, prec) => token(op[0], prec, a => (a && [op, a, expr(0, op.charCodeAt(1)) || null]));

export default parse;
