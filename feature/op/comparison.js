/**
 * Comparison operators
 *
 * < > <= >=
 */
import { binary } from '../../parse/pratt.js';

const COMP = 90;

binary('<', COMP);
binary('>', COMP);
binary('<=', COMP);
binary('>=', COMP);
