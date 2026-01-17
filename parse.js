// Pratt parser core + operator registry + compile
// Character codes
const SPACE = 32;

// current string, index
export let idx, cur,

  // parse input string to AST
  parse = s => (idx = 0, cur = s, parse.newline = false, s = expr(), cur[idx] ? err() : s || ''),

  // display error with context
  err = (msg = 'Unexpected token', at = idx,
    lines = cur.slice(0, at).split('\n'),
    last = lines.pop(),
    before = cur.slice(Math.max(0, at - 40), at),
    ptr = '\u032D',
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

  // end character for current expr scope
  endChar = 0,

  // a + b - c
  expr = (prec = 0, end) => {
    let cc, token, newNode, fn, prevEnd = endChar, prevReserved = parse.reserved, nl;
    if (end) endChar = end, parse.asi && (parse.newline = false);
    parse.reserved = 0;

    while (
      (cc = parse.space()) &&
      (nl = parse.newline, 1) &&
      cc !== endChar &&
      (newNode =
        ((fn = lookup[cc]) && fn(token, prec)) ??
        (parse.asi && token && nl && (newNode = parse.asi(token, prec, expr))) ??
        (!token && !parse.reserved && next(parse.id))
      )
    ) token = newNode, parse.reserved = 0;
    parse.reserved = prevReserved;

    if (end) cc == end ? idx++ : err('Unclosed ' + String.fromCharCode(end - (end > 42 ? 2 : 1)));
    endChar = prevEnd;

    return token;
  },

  // skip space chars, return first non-space character
  space = parse.space = (cc, from = idx) => {
    while ((cc = cur.charCodeAt(idx)) <= SPACE) {
      if (parse.asi && cc === 10) parse.newline = true
      idx++
    }
    return cc
  },

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

  // create operator checker/mapper
  token = (
    op,
    prec = SPACE,
    map,
    c = op.charCodeAt(0),
    l = op.length,
    prev = lookup[c],
    word = op.toUpperCase() !== op,
    matched, r
  ) => lookup[c] = (a, curPrec, curOp, from = idx) =>
    (matched = curOp,
      (curOp ?
        op == curOp :
        (l < 2 || cur.substr(idx, l) == op) && (!word || !parse.id(cur.charCodeAt(idx + l))) && (matched = curOp = op)
      ) &&
      curPrec < prec &&
      (idx += l, (r = map(a)) ? loc(r, from) : (idx = from, matched = 0, word && r !== false && (parse.reserved = 1), !word && !prev && err()), r)
    ) ||
    prev?.(a, curPrec, matched),

  binary = (op, prec, right = false) => token(op, prec, (a, b) => a && (b = expr(prec - (right ? .5 : 0))) && [op, a, b]),

  unary = (op, prec, post) => token(op, prec, a => post ? (a && [op, a]) : (!a && (a = expr(prec - .5)) && [op, a])),

  literal = (op, val) => token(op, 200, a => !a && [, val]),

  nary = (op, prec, right) => {
    token(op, prec,
      (a, b) => (
        b = expr(prec - (right ? .5 : 0)),
        (
          (a?.[0] !== op) && (a = [op, a || null]),
          b?.[0] === op ? a.push(...b.slice(1)) : a.push(b || null),
          a
        ))
    )
  },

  group = (op, prec) => token(op[0], prec, a => (!a && [op, expr(0, op.charCodeAt(1)) || null])),

  access = (op, prec) => token(op[0], prec, a => (a && [op, a, expr(0, op.charCodeAt(1)) || null]));

// === Compile: AST → Evaluator ===

// Current node being compiled (for error location)
let curNode;

// Compile error with optional source location
const compileErr = (msg = 'Compile error', node = curNode) => {
  const e = Error(msg);
  if (node?.loc != null) e.loc = node.loc;
  throw e;
};

// Operator registry
export const operators = {};

// Register an operator (chainable for overrides)
export const operator = (op, fn, prev = operators[op]) =>
  (operators[op] = (...args) => fn(...args) || prev?.(...args));

// Compile AST to evaluator function
export const compile = node => (
  curNode = node,
  !Array.isArray(node) ? (node === undefined ? () => undefined : ctx => ctx?.[node]) :
  node[0] === undefined ? (v => () => v)(node[1]) :
  operators[node[0]]?.(...node.slice(1)) ?? compileErr(`Unknown operator: ${node[0]}`)
);

// Left-value check
export const isLval = n =>
  typeof n === 'string' ||
  (Array.isArray(n) && (
    n[0] === '.' || n[0] === '?.' ||
    (n[0] === '[]' && n.length === 3) || n[0] === '?.[]' ||
    (n[0] === '()' && n.length === 2 && isLval(n[1])) ||
    n[0] === '{}'
  ));

// Property accessor helper
export const prop = (a, fn, generic, obj, path) => (
  a == null ? compileErr('Empty ()') :
  a[0] === '()' && a.length == 2 ? prop(a[1], fn, generic) :
  typeof a === 'string' ? ctx => fn(ctx, a, ctx) :
  a[0] === '.' ? (obj = compile(a[1]), path = a[2], ctx => fn(obj(ctx), path, ctx)) :
  a[0] === '?.' ? (obj = compile(a[1]), path = a[2], ctx => { const o = obj(ctx); return o == null ? undefined : fn(o, path, ctx); }) :
  a[0] === '[]' && a.length === 3 ? (obj = compile(a[1]), path = compile(a[2]), ctx => fn(obj(ctx), path(ctx), ctx)) :
  a[0] === '?.[]' ? (obj = compile(a[1]), path = compile(a[2]), ctx => { const o = obj(ctx); return o == null ? undefined : fn(o, path(ctx), ctx); }) :
  (a = compile(a), ctx => fn([a(ctx)], 0, ctx))
);

// Block prototype chain attacks
export const unsafe = k => k?.[0] === '_' && k[1] === '_' || k === 'constructor' || k === 'prototype';

// Control flow symbols
export const BREAK = Symbol('break'), CONTINUE = Symbol('continue'), RETURN = Symbol('return');

// Loop body executor
export const loop = (body, ctx) => {
  try { return { v: body(ctx) }; }
  catch (e) {
    if (e?.type === BREAK) return { b: 1 };
    if (e?.type === CONTINUE) return { c: 1 };
    if (e?.type === RETURN) return { r: 1, v: e.value };
    throw e;
  }
};

// Destructure value into context
export const destructure = (pattern, value, ctx) => {
  if (typeof pattern === 'string') { ctx[pattern] = value; return; }
  const [op, ...items] = pattern;
  if (op === '{}') {
    for (const item of items) {
      let key, binding, def;
      if (item[0] === '=') [, [, key, binding], def] = item;
      else [, key, binding] = item;
      let val = value[key];
      if (val === undefined && def) val = compile(def)(ctx);
      destructure(binding, val, ctx);
    }
  } else if (op === '[]') {
    let i = 0;
    for (const item of items) {
      if (item === null) { i++; continue; }
      if (Array.isArray(item) && item[0] === '...') { ctx[item[1]] = value.slice(i); break; }
      let binding = item, def;
      if (Array.isArray(item) && item[0] === '=') [, binding, def] = item;
      let val = value[i++];
      if (val === undefined && def) val = compile(def)(ctx);
      destructure(binding, val, ctx);
    }
  }
};

// Accessor marker
export const ACC = Symbol('accessor');

export default parse;
