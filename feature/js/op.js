/**
 * Operators (JS-specific): === !== ?? ??= ||= &&= >>> >>>= in typeof void delete
 *
 * JS operator extensions beyond C-family. Import after c/op.js
 */
import { binary, unary, literal } from '../../parse/pratt.js';

// Precedence levels (ref: MDN operator precedence)
const ASSIGN = 20, LOR = 30, EQ = 80, COMP = 90, SHIFT = 100, PREFIX = 140;

// Strict equality (JS-specific)
binary('===', EQ);
binary('!==', EQ);

// Nullish coalescing
binary('??', LOR);
binary('??=', ASSIGN, true);

// Logical assignment (ES2021)
binary('||=', ASSIGN, true);
binary('&&=', ASSIGN, true);

// Unsigned right shift (JS-specific, not in C)
binary('>>>', SHIFT);
binary('>>>=', ASSIGN, true);

// in operator (object property check)
binary('in', COMP);

// Unary keyword operators
unary('typeof', PREFIX);
unary('void', PREFIX);
unary('delete', PREFIX);

// instanceof - prototype chain check
binary('instanceof', COMP);

// JS literals (beyond C-family true/false)
literal('null', null);
literal('undefined', undefined);
literal('NaN', NaN);
literal('Infinity', Infinity);
