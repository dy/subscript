/**
 * Template literals - parse half
 * `a ${x} b` → ['`', [,'a '], 'x', [,' b']]
 * Tagged: tag`...` → ['``', 'tag', ...]
 */
import { parse, skip, err, expr, lookup, cur, idx } from '../parse.js';
import { decodeEscape } from './string.js';

const ACCESS = 170, BACKTICK = 96, DOLLAR = 36, OBRACE = 123, BSLASH = 92;

// Parse template body after opening ` — string and expression segments
// strictly alternate (string, expr, string, …), so every interpolation is
// flanked by a string part even when empty: `${x}${y}` → [,''] x [,''] y [,''].
// Escapes cook exactly like string literals (decodeEscape: \n \xHH \uHHHH
// \u{H…H}, line continuations) — a template chunk `` must yield the
// same code point as the '' literal.
const parseBody = () => {
  const parts = [];
  let s = '', c, e;
  for (; (c = cur.charCodeAt(idx)) !== BACKTICK; )
    !c ? err('Unterminated template') :
    c === BSLASH ? (e = decodeEscape(), s += e[0], skip(e[1])) :
    c === DOLLAR && cur.charCodeAt(idx + 1) === OBRACE ? (parts.push([, s]), s = '', skip(2), parts.push(expr(0, 125))) :
    (s += cur[idx], skip());
  return parts.push([, s]), skip(), parts;
};

// Collapse a single-part body to that part (string or expression); else keep as ['`', ...parts]
const wrapBody = p => p.length < 2 && p[0]?.[0] === undefined ? p[0] || [,''] : ['`', ...p];

const prev = lookup[BACKTICK];
// Tagged templates: decline when ASI with newline (return undefined to let ASI handle)
lookup[BACKTICK] = (a, prec) =>
  a && prec < ACCESS ? (parse.asi && parse.newline ? void 0 : (skip(), ['``', a, ...parseBody()])) : // tagged
  !a ? (skip(), wrapBody(parseBody())) : // plain
  prev?.(a, prec);
