/**
 * Assignment operators
 *
 * = += -= *= /= %= |= &= ^= >>= <<= >>>= ||= &&= ??=
 * Note: **= is in arithmetic.js (must be with ** for correct parsing)
 */
import { binary } from '../../parse/pratt.js';

const ASSIGN = 20;

// Base assignment (must be first)
binary('=', ASSIGN, true);

// Compound arithmetic
binary('+=', ASSIGN, true);
binary('-=', ASSIGN, true);
binary('*=', ASSIGN, true);
binary('/=', ASSIGN, true);
binary('%=', ASSIGN, true);
// **= is in arithmetic.js

// Compound bitwise
binary('|=', ASSIGN, true);
binary('&=', ASSIGN, true);
binary('^=', ASSIGN, true);
binary('>>=', ASSIGN, true);
binary('<<=', ASSIGN, true);
binary('>>>=', ASSIGN, true);

// Compound logical
binary('||=', ASSIGN, true);
binary('&&=', ASSIGN, true);
binary('??=', ASSIGN, true);
