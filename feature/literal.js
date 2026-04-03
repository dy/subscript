/**
 * Literal values
 *
 * true, false, null, undefined, NaN, Infinity
 *
 * Note: undefined uses [] (empty array) for JSON round-trip compatibility.
 * [, undefined] serializes to [null, null] which would compile to null.
 * [] serializes to [] and compiles back to undefined.
 */
import { literal, keyword } from '../parse.js';

literal('true', true);
literal('false', false);
literal('null', null);
keyword('undefined', 200, () => []);  // [] for JSON compatibility
literal('NaN', NaN);
literal('Infinity', Infinity);
