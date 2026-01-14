/**
 * Arithmetic operators: + - * / % ++ --
 */
import { binary, unary, token, expr } from '../src/parse.js';

// Precedence levels (ref: MDN operator precedence)
const ASSIGN = 20, ADD = 110, MULT = 120, PREFIX = 140, POSTFIX = 150;

// Addition / subtraction
binary('+', ADD);
binary('-', ADD);

// Unary + -
unary('+', PREFIX);
unary('-', PREFIX);

// Multiplication / division / modulo
binary('*', MULT);
binary('/', MULT);
binary('%', MULT);

// Increment / decrement (postfix if has left operand, prefix otherwise)
token('++', POSTFIX, a => a ? ['++', a, null] : ['++', expr(POSTFIX - 1)]);
token('--', POSTFIX, a => a ? ['--', a, null] : ['--', expr(POSTFIX - 1)]);

// Compound assignments
binary('+=', ASSIGN, true);
binary('-=', ASSIGN, true);
binary('*=', ASSIGN, true);
binary('/=', ASSIGN, true);
binary('%=', ASSIGN, true);
