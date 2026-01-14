/**
 * try/catch/finally statements
 *
 * AST:
 *   try { a } catch (e) { b }             → ['try', a, 'e', b]
 *   try { a } finally { c }               → ['try', a, null, null, c]
 *   try { a } catch (e) { b } finally { c } → ['try', a, 'e', b, c]
 */
import { token, skip, space, err, next, parse } from '../src/parse.js';
import { operator, compile } from '../src/compile.js';
import { PREC_STATEMENT, OPAREN, CPAREN } from '../src/const.js';
import { BREAK, CONTINUE, RETURN, parseBlock, isWord } from './block.js';

token('try', PREC_STATEMENT + 1, a => {
  if (a) return;
  const tryBody = parseBlock();
  let catchName = null, catchBody = null, finallyBody = null;

  if (space() === 99 && isWord('catch')) {
    skip(5);
    space() === OPAREN || err('Expected (');
    skip();
    catchName = next(parse.id);
    catchName || err('Expected identifier');
    space() === CPAREN || err('Expected )');
    skip();
    catchBody = parseBlock();
  }

  if (space() === 102 && isWord('finally')) {
    skip(7);
    finallyBody = parseBlock();
  }

  catchName || finallyBody || err('Expected catch or finally');
  return finallyBody ? ['try', tryBody, catchName, catchBody, finallyBody] : ['try', tryBody, catchName, catchBody];
});

operator('try', (tryBody, catchName, catchBody, finallyBody) => {
  tryBody = tryBody ? compile(tryBody) : null;
  catchBody = catchBody ? compile(catchBody) : null;
  finallyBody = finallyBody ? compile(finallyBody) : null;

  return ctx => {
    let result;
    try {
      result = tryBody?.(ctx);
    } catch (e) {
      if (e === BREAK || e === CONTINUE || e?.type === RETURN) throw e;
      if (catchName !== null && catchBody) {
        const had = catchName in ctx, orig = ctx[catchName];
        ctx[catchName] = e;
        try { result = catchBody(ctx); }
        finally { had ? ctx[catchName] = orig : delete ctx[catchName]; }
      } else if (catchName === null) throw e;
    } finally {
      finallyBody?.(ctx);
    }
    return result;
  };
});
