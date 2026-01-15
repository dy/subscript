/**
 * Template literals: `a ${x} b` → ['`', [,'a '], 'x', [,' b']]
 * Tagged templates:  tag`...`  → ['``', 'tag', ...]
 */
import { parse, skip, err, expr, lookup, cur, idx } from '../parse/pratt.js';

const ACCESS = 170, BACKTICK = 96, DOLLAR = 36, OBRACE = 123, BSLASH = 92;
const esc = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v' };

// Parse template body after opening `
const parseBody = () => {
  const parts = [];
  for (let s = '', c; (c = cur.charCodeAt(idx)) !== BACKTICK; )
    !c ? err('Unterminated template') :
    c === BSLASH ? (skip(), s += esc[cur[idx]] || cur[idx], skip()) :
    c === DOLLAR && cur.charCodeAt(idx + 1) === OBRACE ? (s && parts.push([, s]), s = '', skip(2), parts.push(expr(0, 125))) :
    (s += cur[idx], skip(), c = cur.charCodeAt(idx), c === BACKTICK && s && parts.push([, s]));
  return skip(), parts;
};

const prev = lookup[BACKTICK];
// Tagged templates: decline when ASI with newline (return undefined to let ASI handle)
lookup[BACKTICK] = (a, prec) =>
  a && prec < ACCESS ? (parse.asi && parse.newline ? void 0 : (skip(), ['``', a, ...parseBody()])) : // tagged
  !a ? (skip(), (p => p.length < 2 && p[0]?.[0] === undefined ? p[0] || [,''] : ['`', ...p])(parseBody())) : // plain
  prev?.(a, prec);
