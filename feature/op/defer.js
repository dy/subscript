/**
 * Defer operator
 *
 * defer expr: registers cleanup to run at scope exit
 *
 * Common in: Go, Swift, Zig
 */
import { unary } from '../../parse/pratt.js';

const PREFIX = 140;

unary('defer', PREFIX);
