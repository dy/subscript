/**
 * Logical operators (base)
 *
 * ! && ||
 * For ?? see nullish.js
 */
import { binary, unary, operator, compile } from '../../parse.js';

const LOR = 30, LAND = 40, PREFIX = 140;

// ! must be registered before != and !==
binary('!', PREFIX);
unary('!', PREFIX);

binary('||', LOR);
binary('&&', LAND);

// Compile
operator('!', a => (a = compile(a), ctx => !a(ctx)));
operator('||', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) || b(ctx)));
operator('&&', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) && b(ctx)));
