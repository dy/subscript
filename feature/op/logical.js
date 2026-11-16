/**
 * Logical operators (base) - parse half
 *
 * ! && ||
 */
import { binary, unary } from '../../parse.js';

const LOR = 30, LAND = 40, PREFIX = 140;

unary('!', PREFIX);

binary('||', LOR);
binary('&&', LAND);
