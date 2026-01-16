// Block parsing helpers
import { expr, skip, space, lookup, err, parse, seek, cur, idx, parens, loc } from '../parse/pratt.js';

const STATEMENT = 5, OBRACE = 123, CBRACE = 125;

// keyword(op, prec, fn) - prefix-only word token
// keyword('while', 6, () => ['while', parens(), body()])
// keyword('break', 6, () => ['break'])
// attaches .loc to array results for source mapping
export const keyword = (op, prec, map, c = op.charCodeAt(0), l = op.length, prev = lookup[c], r) =>
  lookup[c] = (a, curPrec, curOp, from = idx) =>
    !a &&
    (curOp ? op == curOp : (l < 2 || cur.substr(idx, l) == op) && (curOp = op)) &&
    curPrec < prec &&
    !parse.id(cur.charCodeAt(idx + l)) &&
    (seek(idx + l), (r = map()) ? loc(r, from) : (seek(from), !prev && err()), r) ||
    prev?.(a, curPrec, curOp);

// infix(op, prec, fn) - infix word token (requires left operand)
// infix('catch', 6, a => ['catch', a, parens(), block()])
// infix('finally', 6, a => ['finally', a, block()])
// attaches .loc to array results for source mapping
export const infix = (op, prec, map, c = op.charCodeAt(0), l = op.length, prev = lookup[c], r) =>
  lookup[c] = (a, curPrec, curOp, from = idx) =>
    a &&
    (curOp ? op == curOp : (l < 2 || cur.substr(idx, l) == op) && (curOp = op)) &&
    curPrec < prec &&
    !parse.id(cur.charCodeAt(idx + l)) &&
    (seek(idx + l), loc(r = map(a), from), r) ||
    prev?.(a, curPrec, curOp);

// block() - parse required { body }
export const block = () =>
  (space() === OBRACE || err('Expected {'), skip(), expr(STATEMENT - .5, CBRACE) || null);

// body() - parse { body } or single statement
export const body = () =>
  space() !== OBRACE ? expr(STATEMENT + .5) : (skip(), ['block', expr(STATEMENT - .5, CBRACE) || null]);
