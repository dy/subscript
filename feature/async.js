// Async/await/yield: async function, async arrow, await, yield expressions - parse half
import { parse, unary, expr, skip, seek, keyword, cur, idx, word, peek } from '../parse.js';

const TOKEN = 200, PREFIX = 140, ASSIGN = 20, OPAREN = 40;

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
// async *g() {} → [':', 'g', ['async', ['function*', ...]]]
// Restricted production: a LineTerminator after `async` makes it an identifier.
// TOKEN, like the other member-position prefixes, so it fires inside `static`.
keyword('async', TOKEN, () => {
  if (nlAhead(idx)) return;
  parse.space();
  if (word('function')) return ['async', expr(PREFIX)];
  // member head: key, #key, [key], "key", or a whole *g() {} method
  const from = idx;
  let m = expr(TOKEN - .5);
  if (m?.[0] === ':') return [':', m[1], ['async', m[2]]];
  if (m && peek() === OPAREN) return ['async', m];
  // arrow: async x => / async (...) =>
  if ((m || peek() === OPAREN) && (seek(from), m = expr(ASSIGN - .5))?.[0] === '=>') return ['async', m];
});
