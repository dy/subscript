/**
 * Minimal property access: a.b, a[b], f()
 * For array literals, private fields, see member.js
 */
import { access, binary, group, operator, compile } from '../parse.js';

const ACCESS = 170;

// a[b] - computed member access only (no array literal support)
access('[]', ACCESS);

// a.b - dot member access
binary('.', ACCESS);

// (a) - grouping only (no sequences)
group('()', ACCESS);

// a(b,c,d), a() - function calls
access('()', ACCESS);

// Compile
const err = msg => { throw Error(msg) };
operator('[]', (a, b) => (b == null && err('Missing index'), a = compile(a), b = compile(b), ctx => a(ctx)[b(ctx)]));
operator('.', (a, b) => (a = compile(a), b = !b[0] ? b[1] : b, ctx => a(ctx)[b]));
operator('()', (a, b) => {
  // Group: (expr) - no second argument means grouping, not call
  if (b === undefined) return a == null ? err('Empty ()') : compile(a);
  // Function call: a(b,c)
  const args = !b ? () => [] :
    b[0] === ',' ? (b = b.slice(1).map(compile), ctx => b.map(arg => arg(ctx))) :
    (b = compile(b), ctx => [b(ctx)]);
  a = compile(a);
  return ctx => a(ctx)(...args(ctx));
});
