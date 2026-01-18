// Switch/case/default
// AST: ['switch', val, [';', ['case', test], stmts..., ['default'], stmts...]]
import { expr, skip, space, parens, operator, compile } from '../parse.js';
import { keyword, block } from './block.js';
import { BREAK } from './control.js';

const STATEMENT = 5, ASSIGN = 20, COLON = 58;

keyword('switch', STATEMENT + 1, () => (space(), ['switch', parens(), block()]));
keyword('case', STATEMENT + 1, () => (space(), (c => (space() === COLON && skip(), ['case', c]))(expr(ASSIGN))));
keyword('default', STATEMENT + 1, () => (space() === COLON && skip(), ['default']));

// Compile
operator('switch', (val, cases) => {
  val = compile(val);
  // Parse cases body: [';', ['case', test], stmts..., ['default'], stmts...]
  if (!cases) return ctx => val(ctx);
  const parsed = [];
  const items = cases[0] === ';' ? cases.slice(1) : [cases];
  let current = null;
  for (const item of items) {
    if (Array.isArray(item) && (item[0] === 'case' || item[0] === 'default')) {
      if (current) parsed.push(current);
      current = [item[0] === 'case' ? compile(item[1]) : null, []];
    } else if (current) {
      current[1].push(compile(item));
    }
  }
  if (current) parsed.push(current);

  return ctx => {
    const v = val(ctx);
    let matched = false, result;
    for (const [test, stmts] of parsed) {
      if (matched || test === null || test(ctx) === v) {
        matched = true;
        for (const stmt of stmts) {
          try { result = stmt(ctx); }
          catch (e) {
            if (e?.type === BREAK) return e.value !== undefined ? e.value : result;
            throw e;
          }
        }
      }
    }
    return result;
  };
});
