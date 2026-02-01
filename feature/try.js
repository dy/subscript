// try/catch/finally/throw statements
// AST (faithful): ['try', body, ['catch', param, handler]?, ['finally', cleanup]?]
// Note: body/handler are raw block results, param is raw parens result
import { space, parse, parens, expr, word, skip, operator, compile } from '../parse.js';
import { keyword, block } from './block.js';
import { BREAK, CONTINUE, RETURN } from './control.js';

const STATEMENT = 5;

// try { body } [catch (param) { handler }] [finally { cleanup }]
keyword('try', STATEMENT + 1, () => {
  const node = ['try', block()];
  space();
  if (word('catch')) {
    skip(5); space();
    node.push(['catch', parens(), block()]);
  }
  space();
  if (word('finally')) {
    skip(7);
    node.push(['finally', block()]);
  }
  return node;
});

keyword('throw', STATEMENT + 1, () => {
  parse.asi && (parse.newline = false);
  space();
  if (parse.newline) throw SyntaxError('Unexpected newline after throw');
  return ['throw', expr(STATEMENT)];
});

// Compile try - normalize in compiler, not parser
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
