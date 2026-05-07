/**
 * Bitwise operators - parse half
 *
 * | & ^ ~ >> <<
 */
import { binary, unary } from '../../parse.js';

const OR = 50, XOR = 60, AND = 70, SHIFT = 100, PREFIX = 140;

binary('|', OR);
binary('&', AND);
binary('^', XOR);

binary('>>', SHIFT);
binary('<<', SHIFT);

unary('~', PREFIX);
