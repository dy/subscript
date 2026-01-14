/**
 * Operators (universal): + - * / % < > <= >= == != !
 *
 * Minimal portable operators present in virtually all languages.
 */
import { binary, unary } from '../parse/pratt.js';

// Precedence levels
const ADD = 110, MULT = 120, EQ = 80, COMP = 90, PREFIX = 140;

// Arithmetic
binary('+', ADD);
binary('-', ADD);
binary('*', MULT);
binary('/', MULT);
binary('%', MULT);

// Unary + -
unary('+', PREFIX);
unary('-', PREFIX);

// Comparison
binary('<', COMP);
binary('>', COMP);
binary('<=', COMP);
binary('>=', COMP);

// Equality
binary('==', EQ);
binary('!=', EQ);

// Logical NOT
unary('!', PREFIX);
