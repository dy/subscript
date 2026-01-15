/**
 * Loops: while, do-while, for, break, continue, return
 *
 * AST:
 *   while (c) a              → ['while', c, a]
 *   do a while (c)           → ['do', a, c]
 *   for (i;c;s) a            → ['for', [';', i, c, s], a]
 *   for (x of arr) a         → ['for', ['of', x, arr], a]
 *   for (x in obj) a         → ['for', ['in', x, obj], a]
 *   break/continue/return    → ['break'] / ['continue'] / ['return', x?]
 */
import { expr, skip, space, err, parse, cur, idx } from '../parse/pratt.js';
import { parseBody, keyword, isWord } from './block.js';

const STATEMENT = 5;
const OPAREN = 40, CPAREN = 41, CBRACE = 125, SEMI = 59;

// while (cond) body
keyword('while', STATEMENT + 1, () => {
  space() === OPAREN || err('Expected (');
  skip();
  return ['while', expr(0, CPAREN), parseBody()];
});

// do body while (cond)
keyword('do', STATEMENT + 1, () => {
  const body = parseBody();
  space();
  isWord('while') || err('Expected while');
  skip(5);
  space() === OPAREN || err('Expected (');
  skip();
  return ['do', body, expr(0, CPAREN)];
});

// for (init; cond; step) body OR for (x of/in iterable) body
keyword('for', STATEMENT + 1, () => {
  space() === OPAREN || err('Expected (');
  skip();
  const head = expr(0, CPAREN);
  return ['for', head, parseBody()];
});

// break / continue / return
keyword('break', STATEMENT + 1, () => ['break']);
keyword('continue', STATEMENT + 1, () => ['continue']);
keyword('return', STATEMENT + 1, () => {
  parse.asi && (parse.newline = false);
  space();
  const c = cur.charCodeAt(idx);
  return !c || c === CBRACE || c === SEMI || parse.newline ? ['return'] : ['return', expr(STATEMENT)];
});
