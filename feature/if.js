/**
 * Conditionals: if/else
 *
 * AST:
 *   if (c) a else b    → ['if', c, a, b?]
 *
 * `if` consumes its own `else` branch - making it self-contained.
 * Note: `else` always binds regardless of newlines - ASI doesn't apply between if-body and else.
 */
import { space, skip, expr, err, parse, idx, seek } from '../parse/pratt.js';
import { parseBody, keyword, isWord } from './block.js';

const STATEMENT = 5;
const OPAREN = 40, CPAREN = 41, SEMI = 59;

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
