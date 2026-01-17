/**
 * expr: Minimal expression parser (universal/portable)
 *
 * Parses arithmetic expressions with member access and function calls.
 * Uses only features that are portable across all language targets.
 * Does not include compiler - use with compile/js.js or your own.
 */
import '../feature/number.js';   // Decimal numbers: 123, 1.5, 1e3
import '../feature/string.js';   // Double-quoted strings with escapes

// Universal operators: + - * / % < > <= >= == != !
import '../feature/op/assignment.js';
import '../feature/op/logical.js';
import '../feature/op/bitwise.js';
import '../feature/op/comparison.js';
import '../feature/op/equality.js';
import '../feature/op/membership.js';
import '../feature/op/arithmetic.js';
import '../feature/op/pow.js';
import '../feature/op/increment.js';

import '../feature/group.js';    // Parentheses and function calls
import '../feature/member.js';   // Property access: a.b, a[b]

export * from './pratt.js';
