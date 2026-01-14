/**
 * try/catch/finally/throw statements (C-family)
 *
 * AST:
 *   try { a } catch (e) { b }             → ['try', a, 'e', b]
 *   try { a } finally { c }               → ['try', a, null, null, c]
 *   try { a } catch (e) { b } finally { c } → ['try', a, 'e', b, c]
 *   throw x                               → ['throw', x]
 */
import { token, skip, space, err, next, parse, expr } from '../../parse/pratt.js';
import { parseBlock, isWord } from '../block.js';

const STATEMENT = 5;
const OPAREN = 40, CPAREN = 41;

// try/catch/finally
token('try', STATEMENT + 1, a => {
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

// throw (newline after throw is illegal per JS ASI rules)
token('throw', STATEMENT + 1, a => {
  if (a) return;
  space();
  if (parse.newline) err('Unexpected newline after throw');
  return ['throw', expr(STATEMENT)];
});
