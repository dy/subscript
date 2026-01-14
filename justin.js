// Justin: JSON superset expression language
// Compatible with Jessie's Justin layer: https://github.com/endojs/Jessie
import { err, token, binary } from './src/parse.js';
import compile, { operator, prop } from './src/compile.js';
import { PREC_ASSIGN, PREC_EQ, PREC_LOR, PREC_COMP, PREC_SHIFT, PREC_TOKEN } from './src/const.js';

import subscript from './subscript.js';

// Universal features (C-family, many languages)
import './feature/comment.js';  // //, /* */
import './feature/pow.js';      // **
import './feature/ternary.js';  // ?:
import './feature/collection.js'; // [], {}

// JS-specific expression features
import './feature/js/arrow.js';    // =>
import './feature/js/optional.js'; // ?., ?[]
import './feature/js/spread.js';   // ...
import './feature/js/template.js'; // `${}`, tag``

binary('in', PREC_COMP); operator('in', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) in b(ctx)));

// register !==, ===
binary('===', PREC_EQ); binary('!==', PREC_EQ);
operator('===', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) === b(ctx)));
operator('!==', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) !== b(ctx)));

// add nullish coalescing
binary('??', PREC_LOR);
operator('??', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) ?? b(ctx)));
binary('??=', PREC_ASSIGN, true);
operator('??=', (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => (obj[path] ??= b(ctx)))));

// complete logical assignments
binary('||=', PREC_ASSIGN, true);
operator('||=', (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => (obj[path] ||= b(ctx)))));
binary('&&=', PREC_ASSIGN, true);
operator('&&=', (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => (obj[path] &&= b(ctx)))));

// unsigned shift
binary('>>>', PREC_SHIFT);
operator('>>>', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) >>> b(ctx)));
binary('>>>=', PREC_ASSIGN, true);
operator('>>>=', (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => (obj[path] >>>= b(ctx)))));

// JS literals
token('true', PREC_TOKEN, a => !a && [, true]);
token('false', PREC_TOKEN, a => !a && [, false]);
token('null', PREC_TOKEN, a => !a && [, null]);
token('undefined', PREC_TOKEN, a => !a && [, undefined]);
token('NaN', PREC_TOKEN, a => !a && [, NaN]);

export default subscript;
export * from './subscript.js';
