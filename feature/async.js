// Async/await/yield: async function, async arrow, await, yield expressions
import { unary, expr, skip, space, cur, idx, word, operator, compile } from '../parse.js';
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

// Compile
operator('async', fn => {
  const inner = compile(fn);
  return ctx => {
    const f = inner(ctx);
    return async function(...args) { return f(...args); };
  };
});
operator('await', a => (a = compile(a), async ctx => await a(ctx)));
operator('yield', a => (a = a ? compile(a) : null, ctx => { throw { __yield__: a ? a(ctx) : undefined }; }));
operator('yield*', a => (a = compile(a), ctx => { throw { __yield_all__: a(ctx) }; }));
