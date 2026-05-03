/**
 * jessie: Practical JS subset
 *
 * Builds on justin with statements: blocks, variables, if/else,
 * loops, functions, try/catch, switch, throw.
 */
import './justin.js';

// JS source compatibility
import './feature/unicode.js';

// Statement features
import './feature/var.js';
import './feature/function.js';
import './feature/async.js';
import './feature/class.js';
import './feature/regex.js';

// Control flow
import './feature/if.js';
import './feature/loop.js';
import './feature/try.js';
import './feature/switch.js';
import './feature/statement.js';  // debugger, with, labeled statements

// Module system
import './feature/module.js';
import './feature/accessor.js';

// Automatic Semicolon Insertion
import './feature/asi.js';

export * from './parse.js';
export { default } from './subscript.js';
