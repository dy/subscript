import { nary, group, token, expr, space, cur, idx, parse } from '../parse/pratt.js';

const STATEMENT = 5, SEQ = 10, ACCESS = 170;

// (a,b,c), (a) — uses ACCESS to avoid conflict with ?.
group('()', ACCESS);

// Sequences
nary(',', SEQ);

// Statement sequence - yields when next token needs left operand (else, catch, etc)
token(';', STATEMENT, (a, curPrec) => {
  if (curPrec >= STATEMENT) return;
  if (a?.[0] !== ';') a = [';', a || null];
  const b = expr(STATEMENT - .5);
  // If RHS parsed something, merge; else add null for empty statement
  b?.[0] === ';' ? a.push(...b.slice(1)) : a.push(b || null);
  return a;
});
