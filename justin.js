/**
 * justin: JSON superset expression language
 *
 * Builds on subscript with: C-family operators, comments, collections,
 * plus JS-specific: optional chaining, arrow functions, spread, templates.
 */
import './subscript.js';
import { parse } from './parse.js';

// Add single quotes
parse.string["'"] = true;

// Add hex, binary, octal prefixes
parse.number = { '0x': 16, '0b': 2, '0o': 8 };

import './feature/comment.js';

// Extended operators (JS-specific)
// Note: assignment (=) must be imported BEFORE equality-strict (===)
// so that === is checked first in the token chain
import './feature/op/assignment.js';       // = += -= *= /= etc
import './feature/op/equality-strict.js';  // === !==
import './feature/op/nullish.js';          // ??
import './feature/op/bitwise.js';          // | & ^ ~ >> << >>>
import './feature/op/pow.js';              // ** **=
import './feature/op/increment.js';        // ++ --
import './feature/op/membership.js';       // in (instanceof is in jessie/class.js)

// Extended features
import './feature/member.js';     // Array literals, unsafe check
import './feature/group.js';      // Sequences , ;

// JS-specific operators (ternary, arrow, spread, optional chaining, typeof/void/delete/new)
import './feature/literal.js';
import './feature/op/ternary.js';
import './feature/op/arrow.js';
import './feature/op/spread.js';
import './feature/op/optional.js';
import './feature/op/unary.js';

import './feature/collection.js';
import './feature/template.js';

export * from './parse.js';
export { default } from './subscript.js';
