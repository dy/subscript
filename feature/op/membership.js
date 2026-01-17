/**
 * Membership operator
 *
 * in: key in object
 * of: for-of iteration (parsed as binary in for head)
 *
 * Note: instanceof is in class.js (jessie feature)
 */
import { binary, operator, compile } from '../../parse.js';

const COMP = 90;

binary('in', COMP);
binary('of', COMP);

// Compile
operator('in', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) in b(ctx)));
