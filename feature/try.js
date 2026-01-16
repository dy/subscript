// try/catch/finally/throw statements
// AST: ['catch', ['try', body], param, catchBody] or ['finally', inner, body]
import { space, parse, parens, expr } from '../parse/pratt.js';
import { keyword, infix, block } from './block.js';

const STATEMENT = 5;

keyword('try', STATEMENT + 1, () => ['try', block()]);
infix('catch', STATEMENT + 1, a => (space(), ['catch', a, parens(), block()]));
infix('finally', STATEMENT + 1, a => ['finally', a, block()]);

keyword('throw', STATEMENT + 1, () => {
  parse.asi && (parse.newline = false);
  space();
  if (parse.newline) throw SyntaxError('Unexpected newline after throw');
  return ['throw', expr(STATEMENT)];
});
