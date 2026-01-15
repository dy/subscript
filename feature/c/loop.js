/**
 * Loops: while, for, for-of, for-in, break, continue, return
 *
 * AST:
 *   while (c) a              → ['while', c, a]
 *   for (i;c;s) a            → ['for', i, c, s, a]
 *   for (x of arr) a         → ['for-of', 'x', arr, a]
 *   for (const x of arr) a   → ['for-of', 'x', arr, a, 'const']
 *   for ([a,b] of arr) a     → ['for-of', ['[]', 'a', 'b'], arr, a]
 *   for (x in obj) a         → ['for-in', 'x', obj, a]
 *   for (const x in obj) a   → ['for-in', 'x', obj, a, 'const']
 *   break/continue           → ['break'] / ['continue']
 *   return x                 → ['return', x?]
 */
import { token, expr, skip, space, err, next, parse, cur, idx } from '../../parse/pratt.js';
import { parseBody, prefix, isWord } from '../block.js';
import { parsePattern } from '../js/destruct.js';

const STATEMENT = 5, SEQ = 10, ASSIGN = 20;
const OPAREN = 40, CPAREN = 41, CBRACE = 125, SEMI = 59, OBRACK = 91, OBRACE = 123;

// while (cond) body
prefix('while', STATEMENT + 1, () => {
  space() === OPAREN || err('Expected (');
  skip();
  return ['while', expr(0, CPAREN), parseBody()];
});

// do body while (cond)
prefix('do', STATEMENT + 1, () => {
  const body = parseBody();
  space();
  isWord('while') || err('Expected while');
  skip(5);
  space() === OPAREN || err('Expected (');
  skip();
  const cond = expr(0, CPAREN);
  return ['do', body, cond];
});

// for (init; cond; step) body OR for (x of iterable) body OR for (x in obj) body
prefix('for', STATEMENT + 1, () => {
  space() === OPAREN || err('Expected (');
  skip();

  let init, name, decl = null;
  const cc = space();

  // Check for let/const/var (possibly with destructuring pattern)
  if (isWord('let')) {
    skip(3); decl = 'let'; space();
    const nc = space();
    if (nc === OBRACK || nc === OBRACE) name = parsePattern();
    else { name = next(parse.id); name || err('Expected identifier'); }
  }
  else if (isWord('const')) {
    skip(5); decl = 'const'; space();
    const nc = space();
    if (nc === OBRACK || nc === OBRACE) name = parsePattern();
    else { name = next(parse.id); name || err('Expected identifier'); }
  }
  else if (isWord('var')) {
    skip(3); decl = 'var'; space();
    const nc = space();
    if (nc === OBRACK || nc === OBRACE) name = parsePattern();
    else { name = next(parse.id); name || err('Expected identifier'); }
  }
  else if (cc !== SEMI) {
    // Check for destructuring pattern: [pattern] of, {pattern} of
    if (cc === OBRACK || cc === OBRACE) {
      name = parsePattern();
    } else {
      // Lookahead: is this `id of` or `id in` pattern?
      let p = idx; while (parse.id(cur.charCodeAt(p))) p++; while (cur.charCodeAt(p) <= 32) p++;
      const kw = cur.slice(p, p + 3).trim();
      if ((kw === 'of' || kw === 'in') && !parse.id(cur.charCodeAt(p + (kw === 'of' ? 2 : 2))))
        name = next(parse.id);
      else
        init = expr(SEQ);
    }
  }

  // for-of?
  if (name && space() === 111 && isWord('of')) {
    skip(2); space();
    const iter = expr(SEQ);
    space() === CPAREN || err('Expected )');
    skip();
    return decl ? ['for-of', name, iter, parseBody(), decl] : ['for-of', name, iter, parseBody()];
  }

  // for-in?
  if (name && space() === 105 && isWord('in')) {
    skip(2); space();
    const obj = expr(SEQ);
    space() === CPAREN || err('Expected )');
    skip();
    return decl ? ['for-in', name, obj, parseBody(), decl] : ['for-in', name, obj, parseBody()];
  }

  // Traditional for
  if (decl) {
    space();
    const parseVarDecl = () => {
      const n = name || next(parse.id);
      n || err('Expected identifier');
      space();
      if (cur.charCodeAt(idx) === 61 && cur.charCodeAt(idx + 1) !== 61) {
        skip(); return [decl, n, expr(ASSIGN)];
      }
      if (decl === 'const') err('Expected =');
      return [decl, n];
    };
    init = parseVarDecl();
    name = null; // consumed
    space();
    if (cur.charCodeAt(idx) === 44) { // , - multiple declarations
      const decls = [init];
      while (cur.charCodeAt(idx) === 44) {
        skip(); space();
        decls.push(parseVarDecl());
        space();
      }
      init = [';', ...decls];
    }
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
