/**
 * Membership/instance operators
 *
 * in: key in object
 * of: for-of iteration (parsed as binary in for head)
 * instanceof: object instanceof Constructor
 */
import { binary, operator, compile } from '../../parse.js';

const COMP = 90;

binary('in', COMP);
binary('of', COMP);
binary('instanceof', COMP);

// Compile
operator('in', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) in b(ctx)));
operator('instanceof', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) instanceof b(ctx)));
