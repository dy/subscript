// try/catch/finally/throw statements - parse half
// AST (faithful): ['try', body, ['catch', param, handler]?, ['finally', cleanup]?]
import { space, parse, keyword, parens, expr, word, skip, peek } from '../parse.js';
import { block } from './if.js';

const STATEMENT = 5;

// try { body } [catch (param) { handler }] [finally { cleanup }]
keyword('try', STATEMENT + 1, () => {
  const node = ['try', block()];
  space();
  if (word('catch')) {
    skip(5); space();
    // ES2019 optional catch binding: `catch { ... }` (no parameter)
    node.push(['catch', peek() === 40 ? parens() : null, block()]);
  }
  space();
  if (word('finally')) {
    skip(7);
    node.push(['finally', block()]);
  }
  return node;
});

keyword('throw', STATEMENT + 1, () => {
  parse.asi && (parse.newline = false);
  space();
  if (parse.newline) throw SyntaxError('Unexpected newline after throw');
  return ['throw', expr(STATEMENT)];
});
