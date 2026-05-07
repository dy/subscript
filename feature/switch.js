// Switch/case/default - parse half
// AST: ['switch', val, ['case', test, body], ['default', body], ...]
import { expr, skip, space, keyword, parens, idx, err, seek, lookup, word } from '../parse.js';

const STATEMENT = 5, ASSIGN = 20, COLON = 58, SEMI = 59, CBRACE = 125;

// Flag to track if we're inside switch body (case/default parsing)
let inSwitch = 0;

// Reserve 'case' and 'default' as keywords that fail outside switch body
// Allows property names like {case:1} ONLY when not in switch context
const reserve = (w, l = w.length, c = w.charCodeAt(0), prev = lookup[c]) =>
  lookup[c] = (a, prec, op) => (word(w) && !a && inSwitch) || prev?.(a, prec, op);
reserve('case');
reserve('default');

// caseBody() - parse statements until next case/default/}
const caseBody = (c) => {
  const stmts = [];
  while ((c = space()) !== CBRACE && !word('case') && !word('default')) {
    if (c === SEMI) { skip(); continue; }
    stmts.push(expr(STATEMENT - .5)) || err();
  }
  return stmts.length > 1 ? [';', ...stmts] : stmts[0] || null;
};

// switchBody() - parse case/default statements
const switchBody = () => {
  space() === 123 || err('Expected {'); skip();
  inSwitch++;
  const cases = [];
  try {
    while (space() !== CBRACE) {
      if (word('case')) {
        seek(idx + 4); space();
        const test = expr(ASSIGN - .5);
        space() === COLON && skip();
        cases.push(['case', test, caseBody()]);
      } else if (word('default')) {
        seek(idx + 7); space() === COLON && skip();
        cases.push(['default', caseBody()]);
      } else err('Expected case or default');
    }
  } finally { inSwitch--; }
  skip();
  return cases;
};

// switch (x) { ... }
keyword('switch', STATEMENT + 1, () => space() === 40 && ['switch', parens(), ...switchBody()]);
