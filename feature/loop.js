// Loops: while, do-while, for, for await, break, continue, return - parse half
import { expr, skip, parse, word, keyword, parens, cur, idx, next, seek } from '../parse.js';
import { body } from './if.js';

const STATEMENT = 5, CBRACE = 125, SEMI = 59;

keyword('while', STATEMENT + 1, () => (parse.space(), ['while', parens(), body()]));
keyword('do', STATEMENT + 1, () => (b => (parse.space(), skip(5), parse.space(), ['do', b, parens()]))(body()));

// for / for await
keyword('for', STATEMENT + 1, () => {
  parse.space();
  // for await (x of y)
  if (word('await')) {
    skip(5);
    return (parse.space(), ['for await', parens(), body()]);
  }
  return ['for', parens(), body()];
});

keyword('break', STATEMENT + 1, () => {
  parse.asi && (parse.newline = false);
  const from = idx;
  parse.space();
  const c = cur.charCodeAt(idx);
  if (!c || c === CBRACE || c === SEMI || parse.newline) return ['break'];
  const label = next(parse.id);
  if (!label) return ['break'];
  // Label must be followed by end/semicolon/newline, not another token
  parse.space();
  const cc = cur.charCodeAt(idx);
  if (!cc || cc === CBRACE || cc === SEMI || parse.newline) return ['break', label];
  // Not a valid label - backtrack
  seek(from);
  return ['break'];
});
keyword('continue', STATEMENT + 1, () => {
  parse.asi && (parse.newline = false);
  const from = idx;
  parse.space();
  const c = cur.charCodeAt(idx);
  if (!c || c === CBRACE || c === SEMI || parse.newline) return ['continue'];
  const label = next(parse.id);
  if (!label) return ['continue'];
  parse.space();
  const cc = cur.charCodeAt(idx);
  if (!cc || cc === CBRACE || cc === SEMI || parse.newline) return ['continue', label];
  seek(from);
  return ['continue'];
});
keyword('return', STATEMENT + 1, () => {
  parse.asi && (parse.newline = false);
  const c = parse.space();
  return !c || c === CBRACE || c === SEMI || parse.newline ? ['return'] : ['return', expr(STATEMENT)];
});
