/**
 * Bitwise operators
 *
 * | & ^ ~ >> << >>>
 */
import { binary, unary } from '../../parse/pratt.js';

const OR = 50, XOR = 60, AND = 70, SHIFT = 100, PREFIX = 140;

// Base operators first (tried last in chain)
binary('|', OR);
binary('&', AND);
binary('^', XOR);

// Shifts (after < >)
binary('>>', SHIFT);
binary('<<', SHIFT);
binary('>>>', SHIFT);

// Unary
unary('~', PREFIX);
