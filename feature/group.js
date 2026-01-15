import { nary, group, token, expr, space, cur, idx, parse } from '../parse/pratt.js';

const STATEMENT = 5, SEQ = 10, ACCESS = 170;

// (a,b,c), (a) — uses ACCESS to avoid conflict with ?.
group('()', ACCESS);

// Sequences
nary(',', SEQ);

// Statement sequence - but don't chain if followed by else/catch/finally
// These keywords attach to previous if/try, not start new statements
const isElseCatchFinally = () => {
  const w = cur.slice(idx, idx + 8);
  return (w.startsWith('else') && !parse.id(w.charCodeAt(4))) ||
         (w.startsWith('catch') && !parse.id(w.charCodeAt(5))) ||
         (w.startsWith('finally') && !parse.id(w.charCodeAt(7)));
};

token(';', STATEMENT, (a, curPrec) => {
  if (curPrec >= STATEMENT) return; // precedence check
  space();
  // Don't consume if followed by else/catch/finally
  if (isElseCatchFinally()) return a?.[0] !== ';' ? [';', a || null] : (a.push(null), a);
  const b = expr(STATEMENT - .5);
  if (a?.[0] !== ';') a = [';', a || null];
  b?.[0] === ';' ? a.push(...b.slice(1)) : a.push(b || null);
  return a;
});
