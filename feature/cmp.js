/**
 * Logical and comparison operators: ! || && == != < > <= >=
 */
import { unary, binary } from "../src/parse.js";

// Precedence levels
const LOR = 30, LAND = 40, EQ = 80, COMP = 90, PREFIX = 140;

// Logical NOT
unary('!', PREFIX);

// Logical OR, AND
binary('||', LOR);
binary('&&', LAND);

// Equality
binary('==', EQ);
binary('!=', EQ);

// Comparison
binary('>', COMP);
binary('<', COMP);
binary('>=', COMP);
binary('<=', COMP);
