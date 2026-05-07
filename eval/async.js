// Async/await/yield - eval half
import { operator, compile } from '../parse.js';

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
