// try/catch/finally/throw - eval half
import { operator, compile } from '../parse.js';
import { RETURN } from './op/arrow.js';
import { BREAK, CONTINUE } from './loop.js';

operator('try', (tryBody, ...clauses) => {
  tryBody = tryBody ? compile(tryBody) : null;

  let catchClause = clauses.find(c => c?.[0] === 'catch');
  let finallyClause = clauses.find(c => c?.[0] === 'finally');

  const catchParam = catchClause?.[1];
  const catchBody = catchClause?.[2] ? compile(catchClause[2]) : null;
  const finallyBody = finallyClause?.[1] ? compile(finallyClause[1]) : null;

  return ctx => {
    let result;
    try {
      result = tryBody?.(ctx);
    } catch (e) {
      if (e === BREAK || e === CONTINUE || e === RETURN) throw e;
      if (catchParam !== null && catchParam !== undefined && catchBody) {
        const had = catchParam in ctx, orig = ctx[catchParam];
        ctx[catchParam] = e;
        try { result = catchBody(ctx); }
        finally { had ? ctx[catchParam] = orig : delete ctx[catchParam]; }
      } else if (!catchBody) throw e;
    }
    finally {
      finallyBody?.(ctx);
    }
    return result;
  };
});

operator('throw', val => (val = compile(val), ctx => { throw val(ctx); }));
