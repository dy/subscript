import { nary, group, operator, compile, prop, BREAK, CONTINUE } from '../parse.js';

const STATEMENT = 5, SEQ = 10, ACCESS = 170;

// (a,b,c), (a) — uses ACCESS to avoid conflict with ?.
group('()', ACCESS);

// Sequences
nary(',', SEQ);
nary(';', STATEMENT, true);  // right-assoc to allow same-prec statements

// Compile
const err = msg => { throw Error(msg) };
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

// sequence returns last evaluated value; catches BREAK/CONTINUE and attaches result
const seq = (...args) => (args = args.map(compile), ctx => {
  let r;
  for (const arg of args) {
    try { r = arg(ctx); }
    catch (e) {
      if (e?.type === BREAK || e?.type === CONTINUE) { e.value = r; throw e; }
      throw e;
    }
  }
  return r;
});
operator(',', seq);
operator(';', seq);
