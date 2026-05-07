/**
 * subscript - parse aggregator
 * Minimal expression parser. No eval - import 'subscript/eval/subscript.js' for runtime.
 */

// Literals
import './number.js';       // Decimal numbers: 123, 1.5, 1e3
import './string.js';       // Double-quoted strings with escapes

// Operators (C-family common set) - order matters for token chain performance
import './op/assignment.js';  // = += -= *= /= %= |= &= ^= >>= <<=
import './op/logical.js';     // ! && ||
import './op/bitwise.js';     // ~ | & ^ >> <<
import './op/comparison.js';  // < > <= >=
import './op/equality.js';    // == !=
import './op/arithmetic.js';  // + - * / %
import './op/increment.js';   // ++ --

import './seq.js';            // Sequences: a, b; a; b
import './group.js';          // Grouping: (a)
import './access.js';         // Property access: a.b, a[b], f(), [a,b]

export * from '../parse.js';
