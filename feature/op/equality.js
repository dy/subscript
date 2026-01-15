/**
 * Equality operators
 *
 * == != === !==
 */
import { binary } from '../../parse/pratt.js';

const EQ = 80;

binary('==', EQ);
binary('!=', EQ);
binary('===', EQ);
binary('!==', EQ);
