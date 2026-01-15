/**
 * Function declarations and expressions
 *
 * AST:
 *   function f(a,b) { body }      → ['function', 'f', [',', 'a', 'b'], body]
 *   function f(a) { body }        → ['function', 'f', 'a', body]
 *   function f() { body }         → ['function', 'f', null, body]
 *   function f(a, ...rest) {}     → ['function', 'f', [',', 'a', ['...', 'rest']], body]
 */
import { cur, idx, token, skip, space, next, parse } from '../parse/pratt.js';
import { parseBlock, expect } from './block.js';

const TOKEN = 200, OPAREN = 40;

token('function', TOKEN, a => {
  if (a) return;
  space();
  const name = next(parse.id)
  name && space();
  const params = expect(OPAREN, OPAREN + 1, 0);
  return ['function', name, params, parseBlock()];
});
