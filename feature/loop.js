// Loops: while, do-while, for, for await, break, continue, return
import { expr, skip, space, parse, word, parens, cur, idx } from '../parse/pratt.js';
import { body, keyword } from './block.js';

const STATEMENT = 5, CBRACE = 125, SEMI = 59;

keyword('while', STATEMENT + 1, () => (space(), ['while', parens(), body()]));
keyword('do', STATEMENT + 1, () => (b => (space(), skip(5), space(), ['do', b, parens()]))(body()));

// for / for await
keyword('for', STATEMENT + 1, () => {
  space();
  // for await (x of y)
  if (word('await')) {
    skip(5);
    space();
    return ['for await', parens(), body()];
  }
  return ['for', parens(), body()];
});

keyword('break', STATEMENT + 1, () => ['break']);
keyword('continue', STATEMENT + 1, () => ['continue']);
keyword('return', STATEMENT + 1, () => {
  parse.asi && (parse.newline = false);
  space();
  const c = cur.charCodeAt(idx);
  return !c || c === CBRACE || c === SEMI || parse.newline ? ['return'] : ['return', expr(STATEMENT)];
});
