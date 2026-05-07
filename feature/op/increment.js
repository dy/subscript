/**
 * Increment/decrement operators - parse half
 *
 * ++ -- (prefix and postfix)
 */
import { token, expr } from '../../parse.js';

const POSTFIX = 150;

token('++', POSTFIX, a => a ? ['++', a, null] : ['++', expr(POSTFIX - 1)]);
token('--', POSTFIX, a => a ? ['--', a, null] : ['--', expr(POSTFIX - 1)]);
