// If/else statement - else consumed internally
import { space, skip, expr, err, parse, idx, seek, cur } from '../parse/pratt.js';
import { parseBody, keyword } from './block.js';

const STATEMENT = 5, OPAREN = 40, CPAREN = 41, SEMI = 59;
const isWord = (w, l = w.length) => cur.substr(idx, l) === w && !parse.id(cur.charCodeAt(idx + l));

// Check for `else` after optional semicolon
const checkElse = () => {
  const from = idx;
  if (space() === SEMI) skip();
  space();
  if (isWord('else')) return skip(4), true;
  return seek(from), false;
};

// if (cond) body [else body] - self-contained
keyword('if', STATEMENT + 1, () => {
  space() === OPAREN || err('Expected (');
  skip();
  const cond = expr(0, CPAREN);
  const body = parseBody();
  const node = ['if', cond, body];
  if (checkElse()) node.push(parseBody());
  return node;
});
