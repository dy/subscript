// If/else statement - else consumed internally
import { parse, space, skip, expr, err, keyword, parens, word, idx, seek, operator, compile } from '../parse.js';

const STATEMENT = 5, SEMI = 59;

// block() - parse required { body }
export const block = () =>
  (space() === 123 || err('Expected {'), skip(), expr(STATEMENT - .5, 125) || null);

// body() - parse { body } or single statement
export const body = () =>
  space() !== 123 ? expr(STATEMENT + .5) : (skip(), expr(STATEMENT - .5, 125) || null);

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

// Compile
operator('if', (cond, body, alt) => {
  cond = compile(cond); body = compile(body); alt = alt !== undefined ? compile(alt) : null;
  return ctx => cond(ctx) ? body(ctx) : alt?.(ctx);
});
