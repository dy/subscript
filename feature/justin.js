/**
 * justin - parse aggregator
 * JSON superset expression language. No eval - import 'subscript/eval/justin.js' for runtime.
 */
import './subscript.js';
import { parse } from '../parse.js';

// Add single quotes
parse.string["'"] = true;

// Add hex, binary, octal prefixes
parse.number = { '0x': 16, '0b': 2, '0o': 8 };

import './comment.js';

// Extended operators
// Note: assignment (=) is in subscript, must come BEFORE identity (===)
import './op/identity.js';         // === !==
import './op/nullish.js';          // ??
import './op/pow.js';              // ** **=
import './op/membership.js';       // in (instanceof is in jessie/class.js)
import './op/bitwise-unsigned.js'; // >>> >>>=
import './op/assign-logical.js';   // ||= &&= ??=

// JS-specific operators (ternary, arrow, spread, optional chaining, typeof/void/delete/new)
import './literal.js';
import './op/ternary.js';
import './op/arrow.js';
import './op/spread.js';
import './op/optional.js';
import './op/unary.js';

import './collection.js';
import './template.js';

export * from '../parse.js';
