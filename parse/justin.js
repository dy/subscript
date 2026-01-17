/**
 * justin: JSON superset expression language
 *
 * Builds on expr with: C-family operators, comments, collections,
 * plus JS-specific: optional chaining, arrow functions, spread, templates.
 */
import './expr.js';
import { parse } from './pratt.js';

// Add single quotes
parse.string["'"] = true;

// Add hex, binary, octal prefixes
parse.number = { '0x': 16, '0b': 2, '0o': 8 };

import '../feature/comment.js';

// JS-specific operators (ternary, arrow, spread, optional chaining, typeof/void/delete/new)
import '../feature/literal.js';
import '../feature/op/ternary.js';
import '../feature/op/arrow.js';
import '../feature/op/spread.js';
import '../feature/op/optional.js';
import '../feature/op/unary.js';

import '../feature/collection.js';
import '../feature/template.js';

export * from './pratt.js';
