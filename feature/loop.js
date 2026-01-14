/**
 * Loops: while, for, for-of, break, continue, return
 *
 * AST:
 *   while (c) a              → ['while', c, a]
 *   for (i;c;s) a            → ['for', i, c, s, a]
 *   for (x of arr) a         → ['for-of', 'x', arr, a]
 *   for (const x of arr) a   → ['for-of', 'x', arr, a, 'const']
 *   break/continue           → ['break'] / ['continue']
 *   return x                 → ['return', x?]
 */
import { token, expr, skip, space, err, next, parse, cur, idx } from '../src/parse.js';
import { operator, compile } from '../src/compile.js';
import { PREC_STATEMENT, OPAREN, CPAREN, CBRACE, PREC_SEQ, SEMI } from '../src/const.js';
import { parseBody, BREAK, CONTINUE, RETURN, prefix, isWord } from './block.js';
export { BREAK, CONTINUE, RETURN } from './block.js';

// Loop body executor - handles control flow signals
const loop = (body, ctx) => {
  try { return { v: body(ctx) }; }
  catch (e) {
    if (e === BREAK) return { b: 1 };
    if (e === CONTINUE) return { c: 1 };
    if (e?.type === RETURN) return { r: 1, v: e.value };
    throw e;
  }
};

// while (cond) body
prefix('while', PREC_STATEMENT + 1, () => {
  space() === OPAREN || err('Expected (');
  skip();
  return ['while', expr(0, CPAREN), parseBody()];
});

operator('while', (cond, body) => {
  cond = compile(cond); body = compile(body);
  return ctx => {
    let r, res;
    while (cond(ctx)) if ((r = loop(body, ctx)).b) break; else if (r.r) return r.v; else if (!r.c) res = r.v;
    return res;
  };
});

// for (init; cond; step) body OR for (x of iterable) body
prefix('for', PREC_STATEMENT + 1, () => {
  space() === OPAREN || err('Expected (');
  skip();

  let init, name, decl = null;
  const cc = space();

  // Check for let/const
  if (isWord('let')) { skip(3); decl = 'let'; space(); name = next(parse.id); name || err('Expected identifier'); }
  else if (isWord('const')) { skip(5); decl = 'const'; space(); name = next(parse.id); name || err('Expected identifier'); }
  else if (cc !== SEMI) {
    // Lookahead: is this `id of` pattern?
    let p = idx; while (parse.id(cur.charCodeAt(p))) p++; while (cur.charCodeAt(p) <= 32) p++;
    if (cur.charCodeAt(p) === 111 && cur.charCodeAt(p + 1) === 102 && !parse.id(cur.charCodeAt(p + 2)))
      name = next(parse.id);
    else
      init = expr(PREC_SEQ);
  }

  // for-of?
  if (name && space() === 111 && isWord('of')) {
    skip(2); space();
    const iter = expr(PREC_SEQ);
    space() === CPAREN || err('Expected )');
    skip();
    return decl ? ['for-of', name, iter, parseBody(), decl] : ['for-of', name, iter, parseBody()];
  }

  // Traditional for
  if (decl) {
    space();
    if (cur.charCodeAt(idx) === 61 && cur.charCodeAt(idx + 1) !== 61) { skip(); init = [decl, name, expr(PREC_SEQ)]; }
    else if (decl === 'const') err('Expected =');
    else init = [decl, name];
  } else if (cc === SEMI) init = null;

  space() === SEMI ? skip() : err('Expected ;');
  const cond = space() === SEMI ? null : expr(PREC_SEQ);
  space() === SEMI ? skip() : err('Expected ;');
  const step = space() === CPAREN ? null : expr(PREC_SEQ);
  space() === CPAREN ? skip() : err('Expected )');
  return ['for', init, cond, step, parseBody()];
});

operator('for', (init, cond, step, body) => {
  init = init ? compile(init) : null;
  cond = cond ? compile(cond) : () => true;
  step = step ? compile(step) : null;
  body = compile(body);
  return ctx => {
    let r, res;
    for (init?.(ctx); cond(ctx); step?.(ctx)) if ((r = loop(body, ctx)).b) break; else if (r.r) return r.v; else if (!r.c) res = r.v;
    return res;
  };
});

operator('for-of', (name, iterable, body) => {
  iterable = compile(iterable); body = compile(body);
  return ctx => {
    let r, res;
    const prev = ctx[name];
    for (const val of iterable(ctx)) { ctx[name] = val; if ((r = loop(body, ctx)).b) break; else if (r.r) return r.v; else if (!r.c) res = r.v; }
    ctx[name] = prev;
    return res;
  };
});

// break / continue / return
prefix('break', PREC_STATEMENT + 1, () => ['break']);
operator('break', () => () => { throw BREAK; });

prefix('continue', PREC_STATEMENT + 1, () => ['continue']);
operator('continue', () => () => { throw CONTINUE; });

prefix('return', PREC_STATEMENT + 1, () => {
  space();
  const c = cur.charCodeAt(idx);
  return !c || c === CBRACE || c === SEMI ? ['return'] : ['return', expr(PREC_STATEMENT)];
});

operator('return', val => (val = val !== undefined ? compile(val) : null, ctx => { throw { type: RETURN, value: val?.(ctx) }; }));
