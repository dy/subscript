/**
 * Type operators
 *
 * as: type cast/assertion (identity in JS)
 * is: type check (instanceof in JS)
 *
 * Common in: TypeScript, Kotlin, Swift, C#
 */
import { binary, operator, compile } from '../../parse.js';

const COMP = 90;

binary('as', COMP);
binary('is', COMP);

// Compile (identity in JS)
operator('as', (a, b) => (a = compile(a), ctx => a(ctx)));
operator('is', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) instanceof b(ctx)));
