// try/catch/finally/throw statements
// AST: ['catch', ['try', body], param, catchBody] or ['finally', inner, body]
import { token, skip, space, err, parse, expr } from '../parse/pratt.js';

const STATEMENT = 5, OPAREN = 40, CPAREN = 41, OBRACE = 123, CBRACE = 125;
const block = () => (space() === OBRACE || err('Expected {'), skip(), expr(STATEMENT - .5, CBRACE) || null);

token('try', STATEMENT + 1, a => !a && ['try', block()]);
token('catch', STATEMENT + 1, a => a && (space() === OPAREN || err('Expected ('), skip(), ['catch', a, expr(0, CPAREN), block()]));
token('finally', STATEMENT + 1, a => a && ['finally', a, block()]);

token('throw', STATEMENT + 1, a => {
  if (a) return;
  parse.asi && (parse.newline = false);
  space();
  if (parse.newline) err('Unexpected newline after throw');
  return ['throw', expr(STATEMENT)];
});
