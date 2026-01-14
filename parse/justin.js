/**
 * justin: JSON superset expression language
 *
 * Builds on expr with: comments, ternary, collections, optional chaining,
 * arrow functions, spread, templates, and JS-specific operators.
 */
import './expr.js';

import { token, binary } from './pratt.js';

const ASSIGN = 20, LOR = 30, EQ = 80, COMP = 90, SHIFT = 100, TOKEN = 200;

// Universal features
import '../feature/comment.js';    // //, /* */
import '../feature/pow.js';        // **
import '../feature/ternary.js';    // ?:
import '../feature/collection.js'; // [], {}

// JS-specific expression features
import '../feature/js/arrow.js';    // =>
import '../feature/js/optional.js'; // ?., ?.[]
import '../feature/js/spread.js';   // ...
import '../feature/js/template.js'; // `${}`, tag``

// Additional operators
binary('in', COMP);
binary('===', EQ);
binary('!==', EQ);
binary('??', LOR);
binary('??=', ASSIGN, true);
binary('||=', ASSIGN, true);
binary('&&=', ASSIGN, true);
binary('>>>', SHIFT);
binary('>>>=', ASSIGN, true);

// JS literals
token('true', TOKEN, a => !a && [, true]);
token('false', TOKEN, a => !a && [, false]);
token('null', TOKEN, a => !a && [, null]);
token('undefined', TOKEN, a => !a && [, undefined]);

export * from './pratt.js';
