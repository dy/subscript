// If/else statement - parse half. else consumed internally.
import { parse, skip, expr, err, keyword, parens, word, idx, seek } from '../parse.js';

const STATEMENT = 5, SEMI = 59;

// block() - parse required { body }
export const block = () =>
  (parse.space() === 123 || err('Expected {'), skip(), expr(STATEMENT - .5, 125) || null);

// body() - parse { body } or single statement
export const body = () =>
  parse.space() !== 123 ? expr(STATEMENT + .5) : (skip(), expr(STATEMENT - .5, 125) || null);

// Check for `else` after optional semicolon
const checkElse = () => {
  const from = idx;
  if (parse.space() === SEMI) skip();
  parse.space();
  if (word('else')) return skip(4), true;
  return seek(from), false;
};

// if (cond) body [else body] - self-contained
keyword('if', STATEMENT + 1, () => {
  parse.space();
  const node = ['if', parens(), body()];
  if (checkElse()) node.push(body());
  return node;
});
