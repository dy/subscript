import { nary, group, operator, compile } from '../parse.js';

const STATEMENT = 5, SEQ = 10, ACCESS = 170;

// (a,b,c), (a) — uses ACCESS to avoid conflict with ?.
group('()', ACCESS);

// Sequences
nary(',', SEQ);
nary(';', STATEMENT, true);  // right-assoc to allow same-prec statements

// Compile sequences - returns last evaluated value
const seq = (...args) => (args = args.map(compile), ctx => { let r; for (const a of args) r = a(ctx); return r; });
operator(',', seq);
operator(';', seq);
