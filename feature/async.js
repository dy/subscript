// Async/await/yield: async function, async arrow, await, yield expressions
import { unary, expr, skip, space, cur, idx, word } from '../parse/pratt.js';
import { keyword } from './block.js';

const PREFIX = 140, ASSIGN = 20;

// await expr → ['await', expr]
unary('await', PREFIX);

// yield expr → ['yield', expr]
// yield* expr → ['yield*', expr]
keyword('yield', PREFIX, () => {
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
keyword('async', PREFIX, () => {
  space();
  // async function - check for 'function' word
  if (word('function')) return ['async', expr(PREFIX)];
  // async arrow: async () => or async x =>
  // Parse at assign precedence to catch => operator
  const params = expr(ASSIGN - .5);
  return params && ['async', params];
});
