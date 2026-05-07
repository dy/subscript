/**
 * Unsigned right shift operators - parse half
 *
 * >>> >>>=
 */
import { binary } from '../../parse.js';

const ASSIGN = 20, SHIFT = 100;

binary('>>>', SHIFT);
binary('>>>=', ASSIGN, true);
