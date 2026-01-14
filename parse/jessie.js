/**
 * jessie: Practical JS subset
 *
 * Builds on justin with statements: blocks, variables, if/else,
 * loops, functions, try/catch, switch, throw.
 */
import './justin.js';

// C-family statement features
import '../feature/c/if.js';
import '../feature/c/loop.js';
import '../feature/c/try.js';    // try/catch/finally/throw
import '../feature/c/switch.js';

// Universal statement features
import '../feature/var.js';
import '../feature/function.js';
import '../feature/regex.js';

// JS-specific statement features
import '../feature/js/destruct.js';
import '../feature/js/module.js';
import '../feature/js/accessor.js';

export * from './pratt.js';
