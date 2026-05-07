/**
 * Comparison operators - parse half
 *
 * < > <= >=
 */
import { binary } from '../../parse.js';

const COMP = 90;

binary('<', COMP);
binary('>', COMP);
binary('<=', COMP);
binary('>=', COMP);
