// Block parsing helpers
import { expr, skip, space, lookup, err, parse, seek, cur, idx } from '../parse/pratt.js';

const STATEMENT = 5, OBRACE = 123, CBRACE = 125;

// keyword - prefix-only token for statement keywords
export const keyword = (op, prec, map, c = op.charCodeAt(0), l = op.length, prev = lookup[c]) =>
  lookup[c] = (a, curPrec, curOp, from = idx) =>
    !a &&
    (curOp ? op == curOp : (l < 2 || cur.substr(idx, l) == op) && (curOp = op)) &&
    curPrec < prec &&
    !parse.id(cur.charCodeAt(idx + l)) &&
    (seek(idx + l), map() || (seek(from), !prev && err())) ||
    prev?.(a, curPrec, curOp);

// Parse { body } or single statement - for if/while/for
export const parseBody = () =>
  space() !== OBRACE ? expr(STATEMENT + .5) : (skip(), ['block', expr(STATEMENT - .5, CBRACE) || null]);
