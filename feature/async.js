// Async/await/yield: async function, async arrow, await, yield expressions - parse half
import { parse, unary, expr, skip, seek, keyword, cur, idx, word, next } from '../parse.js';

const PREFIX = 140, ASSIGN = 20, OPAREN = 40;

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
keyword('async', PREFIX, () => {
  parse.space();
  // async function - check for 'function' word
  if (word('function')) return ['async', expr(PREFIX)];
  // async name( → method shorthand (accessor.js handles params + body)
  // async name => → arrow with single param
  const from = idx;
  const name = next(parse.id);
  if (name) {
    parse.space();
    if (cur.charCodeAt(idx) === OPAREN) return ['async', name];
    seek(from); // backtrack for general arrow parsing
  }
  // async arrow: async () => or async x =>
  const params = expr(ASSIGN - .5);
  return params && ['async', params];
});
