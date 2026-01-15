/**
 * justin: JSON superset expression language
 *
 * Builds on expr with: C-family operators, comments, collections,
 * plus JS-specific: optional chaining, arrow functions, spread, templates.
 */
import './expr.js';
import { parse } from './pratt.js';
import { string } from '../feature/string.js';

// Add single quotes
string("'");

// Add hex, binary, octal prefixes
parse.number = { '0x': 16, '0b': 2, '0o': 8 };

// Add C-style comments (default: //, /**/)
import '../feature/comment.js';

import '../feature/collection.js';
import '../feature/template.js';

export * from './pratt.js';
