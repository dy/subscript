/**
 * Exponentiation operator
 *
 * ** **=
 *
 * ES2016+, not in classic JS/C
 */
import { binary } from '../../parse/pratt.js';

const EXP = 130, ASSIGN = 20;

binary('**', EXP, true);
binary('**=', ASSIGN, true);
