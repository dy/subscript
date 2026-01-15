// Loops: while, do-while, for, break, continue, return
import { expr, skip, space, parse, cur, idx } from '../parse/pratt.js';
import { parseBody, keyword } from './block.js';

const STATEMENT = 5, OPAREN = 40, CPAREN = 41, CBRACE = 125, SEMI = 59;

keyword('while', STATEMENT + 1, () => (space(), skip(), ['while', expr(0, CPAREN), parseBody()]));
keyword('do', STATEMENT + 1, () => (b => (space(), skip(5), space(), skip(), ['do', b, expr(0, CPAREN)]))(parseBody()));
keyword('for', STATEMENT + 1, () => (space(), skip(), ['for', expr(0, CPAREN), parseBody()]));
keyword('break', STATEMENT + 1, () => ['break']);
keyword('continue', STATEMENT + 1, () => ['continue']);
keyword('return', STATEMENT + 1, () => {
  parse.asi && (parse.newline = false);
  space();
  const c = cur.charCodeAt(idx);
  return !c || c === CBRACE || c === SEMI || parse.newline ? ['return'] : ['return', expr(STATEMENT)];
});
