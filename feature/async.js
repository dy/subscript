// Async/await/yield: async function, async arrow, await, yield expressions - parse half
import { parse, unary, expr, skip, seek, keyword, cur, idx, word } from '../parse.js';

const PREFIX = 140, ASSIGN = 20;
const OPAREN = 40, OBRACE = 123;

// await expr → ['await', expr]
unary('await', PREFIX);

// yield expr → ['yield', expr]
// yield* expr → ['yield*', expr]
keyword('yield', PREFIX, () => {
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
  // async arrow: async () => or async x =>
  // Parse at assign precedence to catch => operator
  const from = idx;
  const params = expr(ASSIGN - .5);
  if (params?.[0] === '()' && typeof params[1] === 'string' && parse.space() === OBRACE) {
    let at = from;
    while (cur.charCodeAt(at) <= 32) at++;
    while (parse.id(cur.charCodeAt(at))) at++;
    while (cur.charCodeAt(at) <= 32) at++;
    if (cur.charCodeAt(at) === OPAREN) seek(at);
    return ['async', params[1]];
  }
  return params && ['async', params];
});
