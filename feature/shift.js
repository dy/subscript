/**
 * Shift operators: << >> with assignments
 * Note: Must be imported AFTER comparison operators (>, <) for correct parsing
 */
import { binary } from "../src/parse.js";

const ASSIGN = 20, SHIFT = 100;

binary('>>', SHIFT);
binary('<<', SHIFT);
binary('>>=', ASSIGN, true);
binary('<<=', ASSIGN, true);
