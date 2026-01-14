/**
 * Block scope and control flow infrastructure
 *
 * AST:
 *   { a; b }  → ['block', [';', a, b]]
 *
 * Shared by: if.js, loop.js, switch.js, try.js, function.js
 */
import { token, expr, skip, space, lookup, err, parse, seek, cur, idx } from '../src/parse.js';
import { operator, compile } from '../src/compile.js';
import { OBRACE, CBRACE, PREC_STATEMENT, SEMI } from '../src/const.js';

// prefix-only token - only matches when no left operand (for JS statement keywords)
export const prefix = (op, prec, map, c = op.charCodeAt(0), l = op.length, prev = lookup[c]) =>
  lookup[c] = (a, curPrec, curOp, from = idx) =>
    !a &&
    (curOp ? op == curOp : (l < 2 || cur.substr(idx, l) == op) && (curOp = op)) &&
    curPrec < prec &&
    !parse.id(cur.charCodeAt(idx + l)) &&
    (seek(idx + l), map() || (seek(from), !prev && err())) ||
    prev?.(a, curPrec, curOp);

// Control signals for break/continue/return
export const BREAK = Symbol('break'), CONTINUE = Symbol('continue'), RETURN = Symbol('return');

// Check if next word matches (for catch/finally/case/default etc)
export const isWord = (w, l = w.length) => cur.substr(idx, l) === w && !parse.id(cur.charCodeAt(idx + l));

// Parse { body } strictly (no single-statement shorthand)
export const parseBlock = () => {
  space() === OBRACE || err('Expected {');
  skip();
  const stmts = [];
  while (space() !== CBRACE) (s => s && stmts.push(s))(expr(PREC_STATEMENT)), space() === SEMI && skip();
  return skip(), stmts.length < 2 ? stmts[0] || null : [';', ...stmts];
};

// Block parsing helper - parses { body } or single statement
export const parseBody = () => {
  if (space() !== OBRACE) return (s => (space() === SEMI && skip(), s))(expr(PREC_STATEMENT + .5));
  skip();
  const stmts = [];
  while (space() !== CBRACE) (s => s && stmts.push(s))(expr(PREC_STATEMENT)), space() === SEMI && skip();
  skip();
  return ['block', stmts.length < 2 ? stmts[0] || null : [';', ...stmts]];
};

// Block operator - executes body
operator('block', body => {
  if (body === undefined) return () => {};
  body = compile(body);
  return ctx => body(ctx);
});
