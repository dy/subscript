// Character codes
const SPACE = 32;

// current string, index
export let idx, cur,

  // no handling tagged literals since easily done on user side with cache, if needed
  parse = s => (idx = 0, cur = s, parse.newline = false, s = expr(), cur[idx] ? err() : s || ''),

  // display error with context
  // err.ptr: string suffix (combining diacritics) or [before, after] wrapper
  err = (msg = 'Unexpected token',
    lines = cur.slice(0, idx).split('\n'),
    last = lines.pop(),
    before = cur.slice(Math.max(0, idx - 40), idx),
    ptr = '\u032D',//'\u030C\u032D',
    at = (cur[idx] || '∅') + ptr,
    after = cur.slice(idx + 1, idx + 20)
  ) => {
    throw SyntaxError(`${msg} at ${lines.length + 1}:${last.length + 1} — ${before}${at}${after}`)
  },

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
    let cc, token, newNode, fn, prevEnd = endChar, hadNewline;
    if (end) endChar = end;

    // chunk/token parser
    while (
      (cc = parse.space()) && // till not end
      (hadNewline = parse.newline, true) && // save newline state before potential recursive calls
      cc !== endChar &&  // stop at end char
      // NOTE: when lookup bails on lower precedence, parent expr re-calls space() — acceptable overhead
      (newNode =
        ((fn = lookup[cc]) && fn(token, prec)) ?? // if operator with higher precedence isn't found
        (token && hadNewline && parse.asi?.(token, prec, expr)) ?? // ASI hook: language-defined newline handling
        (!token && next(parse.id)) // parse literal or quit. token seqs are forbidden: `a b`, `a "b"`, `1.32 a`
      )
    ) token = newNode;

    // check end character - only if we set it (not inherited)
    if (end) cc == end ? idx++ : err('Unclosed ' + String.fromCharCode(end - (end > 42 ? 2 : 1)));
    endChar = prevEnd;

    return token;
  },

  // skip space chars, return first non-space character (configurable via parse.space)
  // Sets parse.newline = true if newline was crossed (for ASI support)
  // Preserves newline flag if no whitespace was consumed (for nested expr returns)
  space = parse.space = (cc, from = idx) => { 
    while ((cc = cur.charCodeAt(idx)) <= SPACE) { 
      if (cc === 10) parse.newline = true
      idx++ 
    }
    if (idx === from) return cc // no whitespace consumed, preserve newline state
    if (!parse.newline) parse.newline = false // only reset if we consumed whitespace without newline
    return cc 
  },

  // parse identifier (configurable via parse.id)
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
    word = op.toUpperCase() !== op, // make sure word boundary comes after word operator
    matched // track if we matched (for curOp propagation)
  ) => lookup[c] = (a, curPrec, curOp, from = idx) =>
    (matched = curOp, // reset matched to curOp at start (prevents closure leak)
      (curOp ?
        op == curOp :
        ((l < 2 || cur.substr(idx, l) == op) && (matched = curOp = op)) // save matched op
      ) &&
      curPrec < prec && // matches precedence AFTER operator matched
      !(word && parse.id(cur.charCodeAt(idx + l))) && // finished word, not part of bigger word
      (idx += l, map(a) || (idx = from, matched = 0, !word && !prev && err())) // symbols error, words fall through
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
