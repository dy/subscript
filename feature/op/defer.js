/**
 * Defer operator
 *
 * defer expr: registers cleanup to run at scope exit
 *
 * Common in: Go, Swift, Zig
 */
import { unary, operator, compile } from '../../parse.js';

const PREFIX = 140;

unary('defer', PREFIX);

// Compile
operator('defer', a => (a = compile(a), ctx => { ctx.__deferred__ = ctx.__deferred__ || []; ctx.__deferred__.push(a); }));
