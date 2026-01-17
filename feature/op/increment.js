/**
 * Increment/decrement operators
 *
 * ++ -- (prefix and postfix)
 */
import { token, expr, operator } from '../../parse.js';
import { prop, isLval } from '../member.js';

const POSTFIX = 150;

token('++', POSTFIX, a => a ? ['++', a, null] : ['++', expr(POSTFIX - 1)]);
token('--', POSTFIX, a => a ? ['--', a, null] : ['--', expr(POSTFIX - 1)]);

// Compile (b=null means postfix, b=undefined means prefix)
const err = msg => { throw Error(msg) };
operator('++', (a, b) => (isLval(a) || err('Invalid increment target'), prop(a, b === null ? (obj, path) => obj[path]++ : (obj, path) => ++obj[path])));
operator('--', (a, b) => (isLval(a) || err('Invalid decrement target'), prop(a, b === null ? (obj, path) => obj[path]-- : (obj, path) => --obj[path])));
