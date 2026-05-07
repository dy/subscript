/**
 * Unary keyword operators - parse half
 *
 * typeof x → type string
 * void x → undefined
 * delete x → remove property
 * new X() → construct instance
 */
import { unary, keyword, skip, expr, word } from '../../parse.js';

const PREFIX = 140;

unary('typeof', PREFIX);
unary('void', PREFIX);
unary('delete', PREFIX);
// new X() or new.target
keyword('new', PREFIX, () =>
  word('.target') ? (skip(7), ['new.target']) : ['new', expr(PREFIX)]
);
