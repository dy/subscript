/**
 * Strings (C-family): + 'single quotes'
 *
 * Extends root string.js with single-quote strings.
 * Import after feature/string.js
 */
import { lookup } from '../../parse/pratt.js';
import { string } from '../string.js';

const QUOTE = 39;

lookup[QUOTE] = string(QUOTE);
