// Async/await/yield: async function, async arrow, await, yield expressions
import { token, unary, expr, skip, space, next, parse, cur, idx } from '../parse/pratt.js';

const PREFIX = 140, ASSIGN = 20;

// await expr → ['await', expr]
unary('await', PREFIX);

// yield expr → ['yield', expr]
// yield* expr → ['yield*', expr]
token('yield', PREFIX, a => {
  if (a) return;
  space();
  if (cur[idx] === '*') {
    skip();
    space();
    return ['yield*', expr(ASSIGN)];
  }
  return ['yield', expr(ASSIGN)];
});

// async function name() {} → ['async', ['function', name, params, body]]
// async () => {} → ['async', ['=>', params, body]]
// async x => {} → ['async', ['=>', x, body]]
token('async', PREFIX, a => {
  if (a) return;
  space();
  // async function - check for 'function' word
  if (cur.substr(idx, 8) === 'function' && !parse.id(cur.charCodeAt(idx + 8))) {
    return ['async', expr(PREFIX)];
  }
  // async arrow: async () => or async x =>
  // Parse at assign precedence to catch => operator
  const params = expr(ASSIGN - .5);
  return params && ['async', params];
});
