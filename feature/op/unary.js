/**
 * Unary keyword operators - parse half
 *
 * typeof x → type string
 * void x → undefined
 * delete x → remove property
 * new X() → construct instance
 */
import { unary, keyword, skip, expr, word, parse, lookup } from '../../parse.js';

const PREFIX = 140, CALL = 160, NEW = CALL + 1;

unary('typeof', PREFIX);
unary('void', PREFIX);
unary('delete', PREFIX);

// new X(a).m(b) → ((new X(a)).m(b)). `new` binds exactly one call: it sits
// between member access (`.` `[]`, ACCESS) and the call `()` (CALL), so
// expr(CALL) reads the constructor reference — name and member chain — but
// stops before the argument list. The one optional `(...)` is read by the `(`
// rules, as the loop reads a call, so a rule that has read that span already
// hands it over (accessor.js keeps the `(…)` after `get[k]`); any trailing
// `.m(b)` then applies to the result via the normal Pratt loop.
const args = a => parse.space() === 40 && lookup[40](a, CALL - .5) || a;

keyword('new', NEW, () =>
  word('.target') ? (skip(7), ['new.target']) : ['new', args(expr(CALL))]
);
