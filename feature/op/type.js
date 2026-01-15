/**
 * Type operators
 *
 * as: type cast/assertion (identity in JS)
 * is: type check (instanceof in JS)
 *
 * Common in: TypeScript, Kotlin, Swift, C#
 */
import { binary } from '../../parse/pratt.js';

const COMP = 90;

binary('as', COMP);
binary('is', COMP);
