/**
 * Increment/decrement operators
 *
 * ++ -- (prefix and postfix)
 */
import { token, expr } from '../../parse/pratt.js';

const POSTFIX = 150;

token('++', POSTFIX, a => a ? ['++', a, null] : ['++', expr(POSTFIX - 1)]);
token('--', POSTFIX, a => a ? ['--', a, null] : ['--', expr(POSTFIX - 1)]);
