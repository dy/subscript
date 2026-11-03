/**
 * Import/Export with contextual 'from' operator - parse half
 *
 *   import './x.js'              → ['import', path]
 *   import X from './x.js'       → ['import', ['from', 'X', path]]
 *   import { a, b } from './x'   → ['import', ['from', ['{}', ...], path]]
 *   import * as X from './x.js'  → ['import', ['from', ['as', '*', X], path]]
 *   export { a } from './x'      → ['export', ['from', ['{}', ...], path]]
 *   export const x = 1           → ['export', decl]
 */
import { parse, token, expr, keyword, lookup, skip, word, peek } from '../parse.js';

const STATEMENT = 5, SEQ = 10, STAR = 42, DQUOTE = 34, QUOTE = 39;

// A module path is a string literal; an alias starts as a name or a string does.
const path = (c = peek()) => c === DQUOTE || c === QUOTE;
const alias = (c = peek()) => path(c) || parse.id(c);

// * as prefix in import context (import * as X)
const prevStar = lookup[STAR];
lookup[STAR] = (a, prec) => !a ? (skip(), '*') : prevStar?.(a, prec);

// 'from' as contextual binary - only after import-like LHS (not = or ,) and before a path, false elsewhere for identifier fallback
token('from', SEQ + 1, a => !a ? false : a[0] !== '=' && a[0] !== ',' && path() && (parse.space(), ['from', a, expr(SEQ + 1)]));

// 'as' for aliasing: * as X, { a as b }. False elsewhere for identifier fallback
token('as', SEQ + 2, a => !a ? false : alias() && (parse.space(), ['as', a, expr(SEQ + 2)]));

// import: prefix that parses specifiers + from + path
// import.meta returns ['import.meta']
keyword('import', STATEMENT, () => (
  word('.meta') ? (skip(5), ['import.meta']) : ['import', expr(SEQ)]
));

// export: prefix for declarations or re-exports (use STATEMENT to capture const/let/function).
// `export default X` is recognized inline; outside `export`, `default` stays an identifier.
keyword('export', STATEMENT, () => (
  parse.space(),
  word('default')
    ? (skip(7), ['export', ['default', expr(SEQ)]])
    : ['export', expr(STATEMENT)]
));
