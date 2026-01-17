// try/catch/finally/throw statements
// AST: ['catch', ['try', body], param, catchBody] or ['finally', inner, body]
import { space, parse, parens, expr, operator, compile } from '../parse.js';
import { keyword, infix, block } from './block.js';
import { BREAK, CONTINUE, RETURN } from './loop.js';

const STATEMENT = 5;

keyword('try', STATEMENT + 1, () => ['try', block()]);
infix('catch', STATEMENT + 1, a => (space(), ['catch', a, parens(), block()]));
infix('finally', STATEMENT + 1, a => ['finally', a, block()]);

keyword('throw', STATEMENT + 1, () => {
  parse.asi && (parse.newline = false);
  space();
  if (parse.newline) throw SyntaxError('Unexpected newline after throw');
  return ['throw', expr(STATEMENT)];
});

// Compile
operator('try', tryBody => {
  tryBody = tryBody ? compile(tryBody) : null;
  return ctx => tryBody?.(ctx);
});

operator('catch', (tryNode, catchName, catchBody) => {
  const tryBody = tryNode?.[1] ? compile(tryNode[1]) : null;
  catchBody = catchBody ? compile(catchBody) : null;
  return ctx => {
    let result;
    try {
      result = tryBody?.(ctx);
    } catch (e) {
      if (e?.type === BREAK || e?.type === CONTINUE || e?.type === RETURN) throw e;
      if (catchName !== null && catchBody) {
        const had = catchName in ctx, orig = ctx[catchName];
        ctx[catchName] = e;
        try { result = catchBody(ctx); }
        finally { had ? ctx[catchName] = orig : delete ctx[catchName]; }
      } else if (catchName === null) throw e;
    }
    return result;
  };
});

operator('finally', (inner, finallyBody) => {
  inner = inner ? compile(inner) : null;
  finallyBody = finallyBody ? compile(finallyBody) : null;
  return ctx => {
    let result;
    try { result = inner?.(ctx); }
    finally { finallyBody?.(ctx); }
    return result;
  };
});

operator('throw', val => (val = compile(val), ctx => { throw val(ctx); }));
