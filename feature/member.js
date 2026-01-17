/**
 * Property access and function calls: a.b, a[b], a(b), #private
 */
import { access, binary, token, next, parse, operator, compile, prop, unsafe } from '../parse.js';

const ACCESS = 170, TOKEN = 200;

// a[b]
access('[]', ACCESS);

// a.b
binary('.', ACCESS);

// a(b,c,d), a()
access('()', ACCESS);

// #private fields: #x → '#x' (identifier starting with #)
token('#', TOKEN, a => {
  if (a) return;
  const id = next(parse.id);
  return id ? '#' + id : void 0;
});

// Compile
const err = msg => { throw Error(msg) };
operator('[]', (a, b) => {
  // Array literal: [1,2,3] - b is strictly undefined (AST length 2)
  if (b === undefined) {
    a = !a ? [] : a[0] === ',' ? a.slice(1) : [a];
    a = a.map(a => a[0] === '...' ? (a = compile(a[1]), ctx => a(ctx)) : (a = compile(a), ctx => [a(ctx)]));
    return ctx => a.flatMap(a => a(ctx));
  }
  // Member access: a[b]
  if (b == null) err('Missing index');
  a = compile(a); b = compile(b);
  return ctx => { const k = b(ctx); return unsafe(k) ? undefined : a(ctx)[k]; };
});
operator('.', (a, b) => (a = compile(a), b = !b[0] ? b[1] : b, unsafe(b) ? () => undefined : ctx => a(ctx)[b]));
operator('()', (a, b) => {
  // Group: (expr) - no second argument means grouping, not call
  if (b === undefined) return a == null ? err('Empty ()') : compile(a);
  // Validate: no sparse arguments in calls
  const hasSparse = n => n?.[0] === ',' && n.slice(1).some(a => a == null || hasSparse(a));
  if (hasSparse(b)) err('Empty argument');
  const args = !b ? () => [] :
    b[0] === ',' ? (b = b.slice(1).map(compile), ctx => b.map(arg => arg(ctx))) :
    (b = compile(b), ctx => [b(ctx)]);
  return prop(a, (obj, path, ctx) => obj[path](...args(ctx)), true);
});
