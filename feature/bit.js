/**
 * Bitwise operators: ~ | & ^ with assignments
 */
import { unary, binary } from "../src/parse.js";

// Precedence levels
const ASSIGN = 20, OR = 50, XOR = 60, AND = 70, PREFIX = 140;

unary('~', PREFIX);
binary('|', OR);
binary('&', AND);
binary('^', XOR);
binary('|=', ASSIGN, true);
binary('&=', ASSIGN, true);
binary('^=', ASSIGN, true);
