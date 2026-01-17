/**
 * justin: JSON superset expression language
 *
 * Builds on subscript with JS-specific features:
 * optional chaining, arrow functions, spread, templates.
 */
import './subscript.js';
import { parse } from './parse.js';

// Add single quotes
parse.string["'"] = true;

// Add hex, binary, octal prefixes
parse.number = { '0x': 16, '0b': 2, '0o': 8 };

import './feature/comment.js';

// Extended operators
// Note: assignment (=) is in subscript, must come BEFORE identity (===)
import './feature/op/identity.js';         // === !==
import './feature/op/nullish.js';          // ??
import './feature/op/pow.js';              // ** **=
import './feature/op/membership.js';       // in (instanceof is in jessie/class.js)
import './feature/op/bitwise-unsigned.js'; // >>> >>>=
import './feature/op/assign-logical.js';   // ||= &&= ??= + destructuring

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
