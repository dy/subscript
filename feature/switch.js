// Switch/case/default
// AST: ['switch', val, ['case', test, body], ['default', body], ...]
import { expr, skip, space, parens, operator, compile, idx, err, seek, parse, lookup, word } from '../parse.js';
import { keyword } from './block.js';
import { BREAK } from './control.js';

const STATEMENT = 5, ASSIGN = 20, COLON = 58, SEMI = 59, CBRACE = 125;

// Reserve 'case' and 'default' as keywords that fail outside switch body
// This prevents them becoming identifiers for colon operator
const reserve = (w, c = w.charCodeAt(0), prev = lookup[c]) =>
  lookup[c] = (a, prec, op) => (word(w) && !a && (parse.reserved = 1)) || prev?.(a, prec, op);
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
  const cases = [];
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
  skip();
  return cases;
};

// switch (x) { ... }
keyword('switch', STATEMENT + 1, () => (space(), ['switch', parens(), ...switchBody()]));

// Compile
operator('switch', (val, ...cases) => {
  val = compile(val);
  if (!cases.length) return ctx => val(ctx);

  cases = cases.map(c => [
    c[0] === 'case' ? compile(c[1]) : null,
    (c[0] === 'case' ? c[2] : c[1])?.[0] === ';'
      ? (c[0] === 'case' ? c[2] : c[1]).slice(1).map(compile)
      : (c[0] === 'case' ? c[2] : c[1]) ? [compile(c[0] === 'case' ? c[2] : c[1])] : []
  ]);

  return ctx => {
    const v = val(ctx);
    let matched = false, r;
    for (const [test, stmts] of cases)
      if (matched || test === null || test(ctx) === v)
        for (matched = true, i = 0; i < stmts.length; i++)
          try { r = stmts[i](ctx); }
          catch (e) { if (e?.type === BREAK) return e.value ?? r; throw e; }
    var i;
    return r;
  };
});
