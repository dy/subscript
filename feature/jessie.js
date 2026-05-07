/**
 * jessie - parse aggregator
 * Practical JS subset. No eval - import 'subscript/eval/jessie.js' for runtime.
 */
import './justin.js';

// JS source compatibility
import './unicode.js';

// Statement features
import './var.js';
import './function.js';
import './async.js';
import './class.js';
import './regex.js';

// Control flow
import './if.js';
import './loop.js';
import './try.js';
import './switch.js';
import './statement.js';  // debugger, with, labeled statements

// Module system
import './module.js';
import './accessor.js';

// Shebang line + Automatic Semicolon Insertion
import './shebang.js';
import './asi.js';

export * from '../parse.js';
