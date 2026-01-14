/**
 * jessie: Practical JS subset
 *
 * Builds on justin with statements: blocks, variables, if/else,
 * loops, functions, try/catch, switch, throw.
 */
import './justin.js';

import { token, expr } from './pratt.js';

const PREFIX = 140;

// Statement features
import '../feature/block.js';
import '../feature/var.js';
import '../feature/if.js';
import '../feature/loop.js';
import '../feature/throw.js';
import '../feature/try.js';
import '../feature/function.js';
import '../feature/switch.js';
import '../feature/regex.js';

// JS-specific statement features
import '../feature/js/destruct.js';
import '../feature/js/module.js';
import '../feature/js/accessor.js';

// typeof - unary prefix operator
token('typeof', PREFIX, a => !a && ['typeof', expr(PREFIX - .5)]);

export * from './pratt.js';
