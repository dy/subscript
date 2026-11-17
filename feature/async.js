// Async/await/yield: async function, async arrow, await, yield expressions - parse half
import { parse, unary, expr, skip, keyword, cur, idx, word, peek, lookup, loc } from '../parse.js';

const TOKEN = 200, PREFIX = 140, CALL = 160, ASSIGN = 20;
const OPAREN = 40, CPAREN = 41, OBRACKET = 91, CBRACKET = 93, BACKTICK = 96, OBRACE = 123;

// await expr → ['await', expr]
unary('await', PREFIX);

// yield expr → ['yield', expr]
// yield* expr → ['yield*', expr]
// Restricted production: a LineTerminator after `yield` ends it (yields
// undefined; the next line is its own statement) — the operand never spans.
const LF = 10, CR = 13;
const nlAhead = (i) => { let c; while ((c = cur.charCodeAt(i)) <= 32) { if (c === LF || c === CR) return true; i++ } return false };
keyword('yield', PREFIX, () => {
  if (nlAhead(idx)) return ['yield'];
  parse.space();
  if (cur[idx] === '*') {
    skip();
    parse.space();
    return ['yield*', expr(ASSIGN)];
  }
  return ['yield', expr(ASSIGN)];
});

// async function name() {} → ['async', ['function', name, params, body]]
// async () => {} → ['async', ['=>', params, body]]
// async x => {} → ['async', ['=>', x, body]]
// async key( → ['async', key] (accessor.js's `(` builds the method)
// async [key]( → ['async', ['[]', key]]
// async *g() {} → [':', 'g', ['async', ['function*', ...]]]
// Restricted production: a LineTerminator after `async` makes it an identifier.
// TOKEN, like the other member-position prefixes, so it fires inside `static`.
// Before `(` or `[` the keyword only marks where the bracket opens and declines:
// `async` reads as a name, and the rules below read the bracket once, as its
// call or index, until what follows makes it an arrow's or a member's head.
// Reading the bracket here and declining made the name's call or index read it
// again, at every level of nesting.
// The mark names its source too: one left by an earlier parse never matches.
const arrowAhead = () => parse.space() === 61 && cur.charCodeAt(idx + 1) === 62;
let head = -1, headAt, headIn;
const marked = (a, at) => a === 'async' && at === head && cur === headIn;
keyword('async', TOKEN, () => {
  if (nlAhead(idx)) return;
  const at = idx - 5, c = parse.space();
  if (word('function')) return ['async', expr(PREFIX)];
  if (c === OPAREN || c === OBRACKET) return void (head = idx, headAt = at, headIn = cur);
  // after a template or a block `async` is a name: they head no member, no arrow
  if (c === BACKTICK || c === OBRACE) return;
  // member head: key, #key, "key", or a whole *g() {} method
  let m = expr(TOKEN - .5);
  if (m?.[0] === ':') return [':', m[1], ['async', m[2]]];
  if (m && peek() === OPAREN) return ['async', m];
  // arrow: async x =>, read on from x
  if (m && arrowAhead() && (m = expr(ASSIGN - .5, 0, m))[0] === '=>') return ['async', m];
});

// async (…): the call of `async`, or, with `=>` after it, an async arrow's
// parameters (ECMA-262 reads it so: CoverCallExpressionAndAsyncArrowHead).
const paren = lookup[OPAREN];
lookup[OPAREN] = (a, prec, op, from = idx, at = headAt, args) => {
  if (!marked(a, from) || prec >= CALL) return paren(a, prec, op);
  skip();
  args = expr(0, CPAREN) || null;
  return arrowAhead() ? loc(['async', expr(ASSIGN - .5, 0, loc(['()', args], from))], at) : loc(['()', a, args], from);
};

// async […]: the index of `async`, or, with `(` after it, a computed member head.
const bracket = lookup[OBRACKET];
lookup[OBRACKET] = (a, prec, op, from = idx, at = headAt, key) => {
  if (!marked(a, from)) return bracket(a, prec, op);
  skip();
  key = expr(0, CBRACKET) || null;
  return parse.space() === OPAREN ? loc(['async', loc(['[]', key], from)], at) : loc(['[]', a, key], from);
};
