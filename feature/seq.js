/**
 * Sequence operators (C-family) - parse half
 *
 * , ; — returns last evaluated value
 */
import { nary } from '../parse.js';

const STATEMENT = 5, SEQ = 10;

// Sequences
nary(',', SEQ);
nary(';', STATEMENT, true);  // right-assoc to allow same-prec statements
