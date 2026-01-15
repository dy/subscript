/**
 * Logical operators
 *
 * ! && || ??
 */
import { binary, unary } from '../../parse/pratt.js';

const LOR = 30, LAND = 40, PREFIX = 140;

// ! must be registered before != and !==
binary('!', PREFIX);
unary('!', PREFIX);

binary('||', LOR);
binary('&&', LAND);
binary('??', LOR);
