/**
 * Identity operators
 *
 * === !==
 */
import { binary, operator, compile } from '../../parse.js';

const EQ = 80;

binary('===', EQ);
binary('!==', EQ);

// Compile
operator('===', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) === b(ctx)));
operator('!==', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) !== b(ctx)));
