/**
 * Assignment operators (C-family) - parse half
 *
 * = += -= *= /= %= |= &= ^= >>= <<=
 */
import { binary } from '../../parse.js';

const ASSIGN = 20;

'= += -= *= /= %= |= &= ^= >>= <<='.split(' ').map(op => binary(op, ASSIGN, true));
