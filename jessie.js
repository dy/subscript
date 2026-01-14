// Jessie: Practical JS subset — Justin + statements
// Inspired by https://github.com/endojs/Jessie
//
// Not a strict Jessie reimplementation. Keeps useful features (like `in`),
// allows flexible syntax (naked if-arms). Missing features can be added
// via feature/*.js modules if needed.

import subscript from './justin.js';
import { token, expr } from './src/parse.js';
import { operator, compile } from './src/compile.js';
import { PREC_PREFIX } from './src/const.js';

// Universal statement features
import './feature/block.js';
import './feature/var.js';
import './feature/if.js';
import './feature/loop.js';  // includes for-of (JS-specific)
import './feature/throw.js';
import './feature/try.js';
import './feature/function.js';
import './feature/switch.js';
import './feature/regex.js';

// JS-specific statement features
import './feature/js/destruct.js';
import './feature/js/module.js';
import './feature/js/accessor.js';

// typeof - unary prefix operator
token('typeof', PREC_PREFIX, a => !a && ['typeof', expr(PREC_PREFIX - .5)]);
operator('typeof', a => (a = compile(a), ctx => typeof a(ctx)));

export default subscript;
export * from './justin.js';
