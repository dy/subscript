/**
 * Block scope and control flow infrastructure
 *
 * AST:
 *   { a; b }  → ['block', [';', a, b]]
 *
 * Shared by: if.js, loop.js, switch.js, try.js, function.js
 */
import { token, expr, skip, space, lookup, err, parse, seek, cur, idx } from '../parse/pratt.js';

const STATEMENT = 5;
const OBRACE = 123, CBRACE = 125;

// prefix-only token - only matches when no left operand (for JS statement keywords)
export const prefix = (op, prec, map, c = op.charCodeAt(0), l = op.length, prev = lookup[c]) =>
  lookup[c] = (a, curPrec, curOp, from = idx) =>
    !a &&
    (curOp ? op == curOp : (l < 2 || cur.substr(idx, l) == op) && (curOp = op)) &&
    curPrec < prec &&
    !parse.id(cur.charCodeAt(idx + l)) &&
    (seek(idx + l), map() || (seek(from), !prev && err())) ||
    prev?.(a, curPrec, curOp);

// Check if next word matches (for catch/finally/case/default etc)
export const isWord = (w, l = w.length) => cur.substr(idx, l) === w && !parse.id(cur.charCodeAt(idx + l));

// Expect opening char, parse content up to closing char
export const expect = (open, close = open + 1, prec = STATEMENT, c = space()) =>
  c === open ? (skip(), parse.asi && (parse.newline = false), expr(prec, close) || null) : err('Expected ' + String.fromCharCode(open));

// Parse { body } - for functions, try/catch
export const parseBlock = () => expect(OBRACE, CBRACE, STATEMENT - .5);

// Parse { body } or single statement - for if/while/for
export const parseBody = () =>
  space() !== OBRACE ? expr(STATEMENT + .5) : (skip(), parse.asi && (parse.newline = false), ['block', expr(STATEMENT - .5, CBRACE) || null]);
