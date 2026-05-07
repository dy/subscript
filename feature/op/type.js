/**
 * Type operators - parse half
 *
 * as: type cast/assertion (identity in JS)
 * is: type check (instanceof in JS)
 */
import { binary } from '../../parse.js';

const COMP = 90;

binary('as', COMP);
binary('is', COMP);
