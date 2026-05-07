/**
 * Defer operator - parse half
 *
 * defer expr: registers cleanup to run at scope exit
 */
import { unary } from '../../parse.js';

const PREFIX = 140;

unary('defer', PREFIX);
