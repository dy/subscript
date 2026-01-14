/**
 * justin: JSON superset expression language
 *
 * Builds on expr with: C-family operators, comments, collections,
 * plus JS-specific: optional chaining, arrow functions, spread, templates.
 */
import './expr.js';

import { token, binary } from './pratt.js';

const ASSIGN = 20, LOR = 30, EQ = 80, COMP = 90, SHIFT = 100, TOKEN = 200;

// C-family extensions
import '../feature/c/number.js';   // 0x, 0b, 0o prefixes
import '../feature/c/string.js';   // Single quotes
import '../feature/c/comment.js';  // //, /* */
import '../feature/c/op.js';       // && || & | ^ ~ << >> ++ -- ?: compound assigns

// Universal features not in C-family
import '../feature/pow.js';        // **
import '../feature/collection.js'; // [], {}

// JS-specific expression features
import '../feature/js/arrow.js';    // =>
import '../feature/js/optional.js'; // ?., ?.[]
import '../feature/js/spread.js';   // ...
import '../feature/js/template.js'; // `${}`, tag``

// JS-specific operators
binary('in', COMP);
binary('===', EQ);
binary('!==', EQ);
binary('??', LOR);
binary('??=', ASSIGN, true);
binary('||=', ASSIGN, true);
binary('&&=', ASSIGN, true);
binary('>>>', SHIFT);
binary('>>>=', ASSIGN, true);

// JS literals (beyond C-family true/false)
token('null', TOKEN, a => !a && [, null]);
token('undefined', TOKEN, a => !a && [, undefined]);

export * from './pratt.js';
