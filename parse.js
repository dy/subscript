// Pratt parser core + operator registry + compile.
//
// Language-agnostic by design: the core (token / lookup / prec / the expr loop)
// assumes no particular language. The registrars below — binary, unary, nary,
// literal, group, access, member, keyword — are a shared toolkit of common
// operator *shapes*; each is parameterized by operator string + precedence, so a
// dialect composes its grammar from them. Keep language-specific rules in
// feature/*, not here.

// Character codes
const SPACE = 32;

// current string, index
export let idx, cur,

  // parse input string to AST
  parse = s => (idx = 0, cur = s, parse.enter?.(), s = expr(), cur[idx] ? err() : s || ''),

  // display error with context
  err = (msg = 'Unexpected token', at = idx,
    lines = cur.slice(0, at).split('\n'),
    last = lines.pop(),
    before = cur.slice(Math.max(0, at - 40), at),
    ptr = '\u032D',
    chr = (cur[at] || ' ') + ptr,
    after = cur.slice(at + 1, at + 20)
  ) => {
    throw SyntaxError(`${msg} at ${lines.length + 1}:${last.length + 1}\n${(cur[at-41]!=='\n' ? '' : '') +before}${chr}${after}`)
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

  // a + b - c. Pratt loop. Each iteration tries operator handlers via lookup,
  // then identifier (when no token yet). Dialect layers (e.g. ASI) override
  // step() to inject pre-empt or post-step decisions; default just inlines the
  // op-then-id rule.
  expr = (p = 0, end) => {
    let cc, token, newNode;
    if (end) parse.enter?.(p, end);

    while ((cc = parse.space()) && cc !== end && (newNode = parse.step(token, p, cc, expr))) token = newNode;

    if (end) cc == end ? (idx++, parse.exit?.(p, end)) : err('Unclosed ' + String.fromCharCode(end - (end > 42 ? 2 : 1)));

    return token;
  },

  // peek at next non-space char without modifying idx
  peek = (from = idx) => { while (cur.charCodeAt(from) <= SPACE) from++; return cur.charCodeAt(from); },

  // is char an id?
  id = parse.id = c =>
    (c >= 48 && c <= 57) ||
    (c >= 65 && c <= 90) ||
    (c >= 97 && c <= 122) ||
    c == 36 || c == 95 ||
    (c >= 192 && c != 215 && c != 247),

  // check if word matches at current position
  word = (w, l = w.length) => cur.substr(idx, l) === w && !parse.id(cur.charCodeAt(idx + l)),

  // parse (...) group
  parens = () => (skip(), expr(0, 41)),

  // operator lookup table
  lookup = [],

  // precedence registry - features register via token(), others can read
  prec = {},

  // create operator checker/mapper - for symbols and special cases
  token = (
    op,
    p = SPACE,
    map,
    c = op.charCodeAt(0),
    l = op.length,
    prev = lookup[c],
    word = op.toUpperCase() !== op,
    matched, r
  ) => (p = prec[op] = !prev && prec[op] || p, lookup[c] = (a, curPrec, curOp, from = idx) =>
    (matched = curOp,
      (curOp ?
        op == curOp :
        (l < 2 || (op.charCodeAt(1) === cur.charCodeAt(idx + 1) && (l < 3 || cur.substr(idx, l) == op))) && (!word || !parse.id(cur.charCodeAt(idx + l))) && (matched = curOp = op)
      ) &&
      curPrec < p &&
      (idx += l, (r = map(a)) ? loc(r, from) : (idx = from, matched = 0, !word && !prev && !a && err()), r)
    ) ||
    prev?.(a, curPrec, matched)),

  binary = (op, p, right = false) => token(op, p, a => a && (b => b && [op, a, b])(expr(p - (right ? .5 : 0)))),

  unary = (op, p, post) => token(op, p, a => post ? (a && [op, a]) : (!a && (a = expr(p - .5)) && [op, a])),

  literal = (op, val) => token(op, 200, a => !a && [, val]),

  // nary list (`,` `;`). With no rhs after a separator, the empty slot is a
  // hole only when another separator follows (`[1,,2]`); a separator with
  // nothing else after it is trailing, and its slot is dropped (`[1,2,]` is
  // `[1,2]`). `trail` keeps that trailing slot, for separators whose positions
  // are significant (`;` → `for(;;)` is [;,null,null,null]).
  nary = (op, p, right, trail) =>
    token(op, p,
      (a, b) => (
        b = expr(p - (right ? .5 : 0)),
        (a?.[0] !== op) && (a = [op, a || null]),
        b?.[0] === op ? a.push(...b.slice(1)) :
        b ? a.push(b) :
        (trail || peek() === op.charCodeAt(0)) ? a.push(null) :
        a.length === 2 && (a = a[1]),
        a
      ))
  ,

  group = (op, p) => token(op[0], p, a => (!a && [op, expr(0, op.charCodeAt(1)) || null])),

  access = (op, p) => token(op[0], p, a => (a && [op, a, expr(0, op.charCodeAt(1)) || null])),

  // propName(p) - parse the right side of a name-access operator. A bare name
  // beats keyword/operator matching, so reserved words read as plain identifiers
  // (a.class). Non-name starts (digit, #, ...) fall back to expr(p), keeping the
  // door open for any dialect-defined token there. Uses the live parse.id.
  propName = (p, c) => (parse.space(), c = cur.charCodeAt(idx), parse.id(c) && (c < 48 || c > 57) ? next(parse.id) : expr(p)),

  // member(op, p) - binary operator whose right side is a name, not an expression
  // (a.b, a::b, a->b). Same [op, a, b] shape as binary().
  member = (op, p) => token(op, p, a => a && (b => b && [op, a, b])(propName(p))),

  // keyword(op, p, fn) - prefix word token with property name support.
  // Records p in the prec registry (like token does) so dialects can
  // introspect keyword precedence. parse.prop set by collection.js to
  // prevent matching {keyword: value}.
  keyword = (op, p, map, c = op.charCodeAt(0), l = op.length, prev = lookup[c], r) => (
    prec[op] ??= p,
    lookup[c] = (a, curPrec, curOp, from = idx) =>
      !a &&
      (curOp ? op == curOp : (l < 2 || cur.substr(idx, l) == op) && (curOp = op)) &&
      curPrec < p &&
      !parse.id(cur.charCodeAt(idx + l)) &&
      (!parse.prop || parse.prop(idx + l)) &&
      (seek(idx + l), (r = map()) ? loc(r, from) : seek(from), r) ||
      prev?.(a, curPrec, curOp)
  );

// Skip space chars, return first non-space character.
// Wrappers (comment, asi) compose by reading the previous parse.space first.
parse.space = (cc) => {
  while ((cc = cur.charCodeAt(idx)) <= SPACE) idx++;
  return cc;
};

// One Pratt iteration: try operator, else identifier (only at start).
// Returns truthy node or null so wrapper overrides can chain via `??`.
parse.step = (a, p, cc, expr, fn) =>
  ((fn = lookup[cc]) && fn(a, p)) || (a ? null : next(parse.id) || null);

// === Compile: AST → Evaluator ===


// Operator registry
export const operators = {};

// Register an operator (chainable for overrides)
export const operator = (op, fn, prev = operators[op]) =>
  (operators[op] = (...args) => fn(...args) || prev?.(...args));

// Compile AST to evaluator function
// Note: [, value] serializes to [null, value] in JSON, both forms accepted
export const compile = node => (
  !Array.isArray(node) ? (node === undefined ? () => undefined : ctx => ctx?.[node]) :
  node[0] == null ? (v => () => v)(node[1]) :  // == catches both undefined and null
  operators[node[0]]?.(...node.slice(1)) ?? err(`Unknown operator: ${node[0]}`, node?.loc)
);

export default parse;
