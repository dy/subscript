/**
 * Identity operators - parse half
 *
 * === !==
 */
import { binary } from '../../parse.js';

const EQ = 80;

binary('===', EQ);
binary('!==', EQ);
