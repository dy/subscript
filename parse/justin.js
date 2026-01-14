/**
 * justin: JSON superset expression language
 *
 * Builds on expr with: C-family operators, comments, collections,
 * plus JS-specific: optional chaining, arrow functions, spread, templates.
 */
import './expr.js';

// C-family extensions
import '../feature/c/number.js';   // 0x, 0b, 0o prefixes
import '../feature/c/string.js';   // Single quotes
import '../feature/c/comment.js';  // //, /* */
import '../feature/c/op.js';       // && || & | ^ ~ << >> ++ -- ?: compound assigns

// Universal features not in C-family
import '../feature/pow.js';        // **
import '../feature/collection.js'; // [], {}

// JS-specific expression features
import '../feature/js/op.js';       // === !== ?? in typeof void delete instanceof
import '../feature/js/arrow.js';    // =>
import '../feature/js/optional.js'; // ?., ?.[]
import '../feature/js/spread.js';   // ...
import '../feature/js/template.js'; // `${}`, tag``

export * from './pratt.js';
