/**
 * jessie: Practical JS subset
 *
 * Builds on justin with statements: blocks, variables, if/else,
 * loops, functions, try/catch, switch, throw.
 */
import './justin.js';

// Statement features (var.js must come before destruct.js)
import '../feature/var.js';
import '../feature/function.js';
import '../feature/async.js';
import '../feature/class.js';
import '../feature/regex.js';
import '../feature/destruct.js';

// Control flow
import '../feature/if.js';
import '../feature/loop.js';
import '../feature/try.js';
import '../feature/switch.js';

// Module system
import '../feature/module.js';
import '../feature/accessor.js';

// Automatic Semicolon Insertion
import '../feature/asi.js';

export * from './pratt.js';
export { default } from './pratt.js';
