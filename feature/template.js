/**
 * Template literals - parse half
 * `a ${x} b` → ['`', [,'a '], 'x', [,' b']]
 * Tagged: tag`...` → ['``', 'tag', ...]
 */
import { parse, skip, err, expr, lookup, cur, idx } from '../parse.js';
import { scanString } from './string.js';

const ACCESS = 170, BACKTICK = 96, DOLLAR = 36, OBRACE = 123;

// Parse template body after opening ` — string and expression segments
// strictly alternate (string, expr, string, …), so every interpolation is
// flanked by a string part even when empty: `${x}${y}` → [,''] x [,''] y [,''].
// Escapes cook exactly like string literals (decodeEscape: \n \xHH \uHHHH
// \u{H…H}, line continuations) — a template chunk `` must yield the
// same code point as the '' literal.
const parseBody = () => {
  const parts = [];
  for (;;) {
    parts.push([, scanString(BACKTICK, true)]);
    const c = cur.charCodeAt(idx);
    if (c === BACKTICK) return skip(), parts;
    if (c !== DOLLAR || cur.charCodeAt(idx + 1) !== OBRACE) err('Unterminated template');
    skip(2);
    parts.push(expr(0, 125));
  }
};

// Collapse a single-part body to that part (string or expression); else keep as ['`', ...parts]
const wrapBody = p => p.length < 2 && p[0]?.[0] === undefined ? p[0] || [,''] : ['`', ...p];

const prev = lookup[BACKTICK];
// Tagged templates: decline when ASI with newline (return undefined to let ASI handle)
lookup[BACKTICK] = (a, prec) =>
  a && prec < ACCESS ? (parse.asi && parse.newline ? void 0 : (skip(), ['``', a, ...parseBody()])) : // tagged
  !a ? (skip(), wrapBody(parseBody())) : // plain
  prev?.(a, prec);
