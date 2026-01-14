/**
 * Logical and comparison operators: ! || && == != < > <= >=
 */
import { PREC_LOR, PREC_LAND, PREC_PREFIX, PREC_EQ, PREC_COMP } from '../src/const.js';
import { unary, binary } from "../src/parse.js";
import { operator, compile } from "../src/compile.js";

// Logical NOT
unary('!', PREC_PREFIX), operator('!', (a, b) => !b && (a = compile(a), ctx => !a(ctx)));

// Logical OR, AND
binary('||', PREC_LOR);
operator('||', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) || b(ctx)));

binary('&&', PREC_LAND);
operator('&&', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) && b(ctx)));

// Equality
binary('==', PREC_EQ), operator('==', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) == b(ctx)));
binary('!=', PREC_EQ), operator('!=', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) != b(ctx)));

// Comparison
binary('>', PREC_COMP), operator('>', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) > b(ctx)));
binary('<', PREC_COMP), operator('<', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) < b(ctx)));
binary('>=', PREC_COMP), operator('>=', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) >= b(ctx)));
binary('<=', PREC_COMP), operator('<=', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) <= b(ctx)));
