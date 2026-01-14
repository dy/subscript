/**
 * Template literals: `a ${x} b` → ['`', [,'a '], 'x', [,' b']]
 * Tagged templates:  tag`...`  → ['``', 'tag', ...]
 */
import { skip, err, expr, lookup, cur, idx } from '../../src/parse.js';
import { operator, compile } from '../../src/compile.js';
import { PREC_ACCESS } from '../../src/const.js';

const BACKTICK = 96, DOLLAR = 36, OBRACE = 123, BSLASH = 92;
const esc = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v' };

// Parse template body after opening `
const parseBody = () => {
  const parts = [];
  for (let s = '', c; (c = cur.charCodeAt(idx)) !== BACKTICK; )
    !c ? err('Unterminated template') :
    c === BSLASH ? (skip(), s += esc[cur[idx]] || cur[idx], skip()) :
    c === DOLLAR && cur.charCodeAt(idx + 1) === OBRACE ? (s && parts.push([, s]), s = '', skip(2), parts.push(expr(0, 125))) :
    (s += cur[idx], skip());
  return skip(), parts;
};

const prev = lookup[BACKTICK];
lookup[BACKTICK] = (a, prec) =>
  a && prec < PREC_ACCESS ? (skip(), ['``', a, ...parseBody()]) : // tagged
  !a ? (skip(), (p => p.length < 2 && p[0]?.[0] === undefined ? p[0] || [,''] : ['`', ...p])(parseBody())) : // plain
  prev?.(a, prec);

operator('`', (...parts) => (parts = parts.map(compile), ctx => parts.map(p => p(ctx)).join('')));
operator('``', (tag, ...parts) => {
  tag = compile(tag); parts = parts.map(compile);
  return ctx => {
    const strs = [], vals = [];
    parts.forEach((p, i) => (i % 2 ? vals : strs).push(p(ctx)));
    strs.raw = strs;
    return tag(ctx)(strs, ...vals);
  };
});
