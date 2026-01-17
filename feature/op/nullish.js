/**
 * Nullish coalescing operator (JS-specific)
 *
 * ??
 */
import { binary, operator, compile } from '../../parse.js';

const LOR = 30;

binary('??', LOR);

// Compile
operator('??', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) ?? b(ctx)));
