/**
 * Spread/rest operator
 *
 * ...x → spread in arrays/calls, rest in params
 *
 * Common in: JS, TS, Python (*args), Ruby (*splat)
 */
import { unary } from '../../parse/pratt.js';

const PREFIX = 140;

unary('...', PREFIX);
