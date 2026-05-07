/**
 * Exponentiation operator - parse half
 *
 * ** **=
 */
import { binary } from '../../parse.js';

const EXP = 130, ASSIGN = 20;

binary('**', EXP, true);
binary('**=', ASSIGN, true);
