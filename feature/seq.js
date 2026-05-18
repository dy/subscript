/**
 * Sequence operators (C-family) - parse half
 *
 * , ; — returns last evaluated value
 */
import { nary } from '../parse.js';

const STATEMENT = 5, SEQ = 10;

// Sequences
nary(',', SEQ);                    // list separator: trailing comma drops the slot
nary(';', STATEMENT, true, true);  // statement separator: right-assoc, every slot kept
