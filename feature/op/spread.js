/**
 * Spread/rest operator - parse half
 *
 * ...x → spread in arrays/calls, rest in params
 */
import { unary } from '../../parse.js';

const PREFIX = 140;

unary('...', PREFIX);
