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
import { token, expr, skip, space, err, next, parse, cur, idx } from '../../parse/pratt.js';
import { parseBody, prefix, isWord } from '../block.js';

const STATEMENT = 5, SEQ = 10;
const OPAREN = 40, CPAREN = 41, CBRACE = 125, SEMI = 59;

// while (cond) body
prefix('while', STATEMENT + 1, () => {
  space() === OPAREN || err('Expected (');
  skip();
  return ['while', expr(0, CPAREN), parseBody()];
});

// for (init; cond; step) body OR for (x of iterable) body
prefix('for', STATEMENT + 1, () => {
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
      init = expr(SEQ);
  }

  // for-of?
  if (name && space() === 111 && isWord('of')) {
    skip(2); space();
    const iter = expr(SEQ);
    space() === CPAREN || err('Expected )');
    skip();
    return decl ? ['for-of', name, iter, parseBody(), decl] : ['for-of', name, iter, parseBody()];
  }

  // Traditional for
  if (decl) {
    space();
    if (cur.charCodeAt(idx) === 61 && cur.charCodeAt(idx + 1) !== 61) { skip(); init = [decl, name, expr(SEQ)]; }
    else if (decl === 'const') err('Expected =');
    else init = [decl, name];
  } else if (cc === SEMI) init = null;

  space() === SEMI ? skip() : err('Expected ;');
  const cond = space() === SEMI ? null : expr(SEQ);
  space() === SEMI ? skip() : err('Expected ;');
  const step = space() === CPAREN ? null : expr(SEQ);
  space() === CPAREN ? skip() : err('Expected )');
  return ['for', init, cond, step, parseBody()];
});

// break / continue / return
prefix('break', STATEMENT + 1, () => ['break']);
prefix('continue', STATEMENT + 1, () => ['continue']);
prefix('return', STATEMENT + 1, () => {
  parse.asi && (parse.newline = false);
  space();
  const c = cur.charCodeAt(idx);
  return !c || c === CBRACE || c === SEMI || parse.newline ? ['return'] : ['return', expr(STATEMENT)];
});
