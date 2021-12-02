// src/parse.js
var SPACE = 32;
var idx;
var cur;
var parse = (str, tree) => (cur = str, idx = 0, tree = expr(), idx < cur.length ? err2() : val(tree));
var err2 = (msg = "Bad syntax") => {
  throw Error(msg + " `" + cur[idx] + "` at " + idx);
};
var skip = (is = 1, from = idx) => {
  if (typeof is === "number")
    idx += is;
  else
    while (is(code()))
      idx++;
  return cur.slice(from, idx);
};
var code = (i = 0) => cur.charCodeAt(idx + i);
var char = (n = 1) => cur.substr(idx, n);
var expr = (prec = 0, end, cc, node, i = 0, map, newNode) => {
  while ((cc = parse.space()) && (newNode = lookup[cc]?.(node, prec) || !node && token(cc)))
    node = newNode;
  if (end)
    cc != end ? err2("Unclosed paren") : skip();
  return node;
};
var space = parse.space = (cc) => {
  while (cc = code(), cc <= SPACE)
    idx++;
  return cc;
};
var tokens = parse.token = [];
var token = (c, i = 0, node) => {
  while (i < tokens.length)
    if (node = tokens[i++](c))
      return node;
};
var lookup = [];
var operator = parse.operator = (op, prec = 0, type = 0, map, c = op.charCodeAt(0), l = op.length, prev = lookup[c], spaced = type <= 0 && op.toUpperCase() !== op) => (map = !type ? (node) => {
  node = [op, val(node)];
  do {
    idx += l, node.push(val(expr(prec)));
  } while (parse.space() == c && (l < 2 || char(l) == op) && (!spaced || code(l) <= SPACE));
  return node;
} : type > 0 ? (node) => node && [skip(l), val(node)] : type < 0 ? (node) => !node && [skip(l), val(expr(prec - 1))] : type, lookup[c] = (node, curPrec) => curPrec < prec && (l < 2 || char(l) == op) && (!spaced || code(l) <= SPACE) && map(node) || prev && prev(node, curPrec));
var val = (node) => Array.isArray(node) ? node : (node || err2()).valueOf();
var parse_default = parse;

// src/evaluate.js
var isCmd = (a) => Array.isArray(a) && (typeof a[0] === "string" || isCmd(a[0]));
var evaluate = (s, ctx = {}, c, op) => {
  if (isCmd(s)) {
    c = s[0];
    if (typeof c === "string")
      op = lookup2[c];
    c = op || evaluate(c, ctx);
    if (typeof c !== "function")
      return c;
    return c.call(...s.map((a) => evaluate(a, ctx)));
  }
  if (s && typeof s === "string")
    return s[0] === '"' ? s.slice(1, -1) : s[0] === "@" ? s.slice(1) : s in ctx ? ctx[s] : s;
  return s;
};
var lookup2 = {};
var operator2 = evaluate.operator = (op, fn) => lookup2[op] = fn.length == 2 ? (...a) => a.reduce(fn) : fn;
var evaluate_default = evaluate;

// src/subscript.js
var PERIOD = 46;
var CPAREN = 41;
var CBRACK = 93;
var PREC_SEQ = 1;
var PREC_SOME = 4;
var PREC_EVERY = 5;
var PREC_OR = 6;
var PREC_XOR = 7;
var PREC_AND = 8;
var PREC_EQ = 9;
var PREC_COMP = 10;
var PREC_SHIFT = 11;
var PREC_SUM = 12;
var PREC_MULT = 13;
var PREC_UNARY = 15;
var PREC_POSTFIX = 16;
var PREC_CALL = 18;
var PREC_GROUP = 19;
tokens.push((number) => (number = skip((c) => c > 47 && c < 58 || c == PERIOD)) && ((code() == 69 || code() == 101) && (number += skip(2) + skip((c) => c >= 48 && c <= 57)), isNaN(number = new Number(number)) ? err("Bad number") : number), (q, qc) => q == 34 && skip() + skip((c) => c - q) + skip(), (c) => skip((c2) => c2 >= 48 && c2 <= 57 || c2 >= 65 && c2 <= 90 || c2 >= 97 && c2 <= 122 || c2 == 36 || c2 == 95 || c2 >= 192));
var addOps = (add, stride = 2, list) => {
  for (let i = 0; i < list.length; i += stride)
    add(list[i], list[i + 1], list[i + 2]);
};
addOps(operator, 3, [
  ",",
  PREC_SEQ,
  ,
  "|",
  PREC_OR,
  ,
  "||",
  PREC_SOME,
  ,
  "&",
  PREC_AND,
  ,
  "&&",
  PREC_EVERY,
  ,
  "^",
  PREC_XOR,
  ,
  "==",
  PREC_EQ,
  ,
  "!=",
  PREC_EQ,
  ,
  ">",
  PREC_COMP,
  ,
  ">=",
  PREC_COMP,
  ,
  ">>",
  PREC_SHIFT,
  ,
  ">>>",
  PREC_SHIFT,
  ,
  "<",
  PREC_COMP,
  ,
  "<=",
  PREC_COMP,
  ,
  "<<",
  PREC_SHIFT,
  ,
  "+",
  PREC_SUM,
  ,
  "+",
  PREC_UNARY,
  -1,
  "++",
  PREC_UNARY,
  -1,
  "++",
  PREC_POSTFIX,
  1,
  "-",
  PREC_SUM,
  ,
  "-",
  PREC_UNARY,
  -1,
  "--",
  PREC_UNARY,
  -1,
  "--",
  PREC_POSTFIX,
  1,
  "!",
  PREC_UNARY,
  -1,
  "*",
  PREC_MULT,
  ,
  "/",
  PREC_MULT,
  ,
  "%",
  PREC_MULT,
  ,
  ".",
  PREC_CALL,
  (node, b) => node && [skip(), node, typeof (b = expr(PREC_CALL)) === "string" ? '"' + b + '"' : b.valueOf()],
  "[",
  PREC_CALL,
  (node) => (skip(), node = [".", node, val(expr(0, CBRACK))], node),
  "]",
  ,
  ,
  "(",
  PREC_CALL,
  (node, b) => (skip(), b = expr(0, CPAREN), Array.isArray(b) && b[0] === "," ? (b[0] = node, b) : b ? [node, val(b)] : [node]),
  "(",
  PREC_GROUP,
  (node, b) => !node && (skip(), expr(0, CPAREN) || err()),
  ")",
  ,
  ,
]);
addOps(operator2, 2, [
  "!",
  (a) => !a,
  "++",
  (a) => ++a,
  "--",
  (a) => --a,
  ".",
  (a, b) => a ? a[b] : a,
  "%",
  (a, b) => a % b,
  "/",
  (a, b) => a / b,
  "*",
  (a, b) => a * b,
  "+",
  (a, b) => a + b,
  "-",
  (...a) => a.length < 2 ? -a : a.reduce((a2, b) => a2 - b),
  ">>>",
  (a, b) => a >>> b,
  ">>",
  (a, b) => a >> b,
  "<<",
  (a, b) => a << b,
  ">=",
  (a, b) => a >= b,
  ">",
  (a, b) => a > b,
  "<=",
  (a, b) => a <= b,
  "<",
  (a, b) => a < b,
  "!=",
  (a, b) => a != b,
  "==",
  (a, b) => a == b,
  "&",
  (a, b) => a & b,
  "^",
  (a, b) => a ^ b,
  "|",
  (a, b) => a | b,
  "&&",
  (...a) => a.every(Boolean),
  "||",
  (...a) => a.some(Boolean),
  ",",
  (a, b) => (a, b)
]);
var subscript_default = (s) => (s = typeof s == "string" ? parse_default(s) : s, (ctx) => evaluate_default(s, ctx));
export {
  subscript_default as default,
  evaluate_default as evaluate,
  parse_default as parse
};
