/**
 * Collection literals: arrays and objects (Justin feature)
 *
 * [a, b, c]
 * {a: 1, b: 2}
 * {a, b} (shorthand)
 */
import { group, binary, skip, space, expr, token } from '../src/parse.js';
import { operator, compile } from '../src/compile.js';
import { PREC_ASSIGN, PREC_TOKEN, PREC_STATEMENT, CBRACE, SEMI } from '../src/const.js';

// [a,b,c]
group('[]', PREC_TOKEN);
operator('[]', (a, b) => b === undefined && (
  a = !a ? [] : a[0] === ',' ? a.slice(1) : [a],
  a = a.map(a => a[0] === '...' ? (a = compile(a[1]), ctx => a(ctx)) : (a = compile(a), ctx => [a(ctx)])),
  ctx => a.flatMap(a => a(ctx))
));

// {a:1, b:2, c:3} - object literal / block
token('{', PREC_TOKEN, a => {
  if (a) return; // not prefix - let other handlers try

  // Parse statements until }
  const stmts = [];
  while (space() !== CBRACE) {
    const stmt = expr(PREC_STATEMENT);
    if (stmt) stmts.push(stmt);
    while (space() === SEMI) skip();
  }
  skip(); // consume }

  const content = stmts.length === 0 ? null : stmts.length === 1 ? stmts[0] : [';', ...stmts];
  return ['{}', content];
});

operator('{}', (a, b) => b === undefined && (
  a = !a ? [] : a[0] !== ',' ? [a] : a.slice(1),
  a = a.map(p => compile(typeof p === 'string' ? [':', p, p] : p)),
  ctx => Object.fromEntries(a.flatMap(frag => frag(ctx)))
));

// a: b (colon operator for object properties)
binary(':', PREC_ASSIGN - 1, true);
operator(':', (a, b) => (b = compile(b), Array.isArray(a) ? (a = compile(a), ctx => [[a(ctx), b(ctx)]]) : ctx => [[a, b(ctx)]]));
