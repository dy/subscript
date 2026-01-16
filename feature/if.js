// If/else statement - else consumed internally
import { space, skip, parens, word, idx, seek } from '../parse/pratt.js';
import { body, keyword } from './block.js';

const STATEMENT = 5, SEMI = 59;

// Check for `else` after optional semicolon
const checkElse = () => {
  const from = idx;
  if (space() === SEMI) skip();
  space();
  if (word('else')) return skip(4), true;
  return seek(from), false;
};

// if (cond) body [else body] - self-contained
keyword('if', STATEMENT + 1, () => {
  space();
  const node = ['if', parens(), body()];
  if (checkElse()) node.push(body());
  return node;
});
