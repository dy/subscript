/**
 * Import/Export with contextual 'from' operator
 *
 * AST:
 *   import './x.js'              → ['import', path]
 *   import X from './x.js'       → ['import', ['from', 'X', path]]
 *   import { a, b } from './x'   → ['import', ['from', ['{}', ...], path]]
 *   import * as X from './x.js'  → ['import', ['from', ['as', '*', X], path]]
 *   export { a } from './x'      → ['export', ['from', ['{}', ...], path]]
 *   export const x = 1           → ['export', decl]
 */
import { token, expr, space, lookup, skip } from '../parse.js';
import { keyword } from './block.js';

const STATEMENT = 5, SEQ = 10, STAR = 42;

// * as prefix in import context (import * as X)
const prevStar = lookup[STAR];
lookup[STAR] = (a, prec) => !a ? (skip(), '*') : prevStar?.(a, prec);

// 'from' as contextual binary - only after import-like LHS (not = or ,), false in prefix for identifier fallback
token('from', SEQ + 1, a => !a ? false : a[0] !== '=' && a[0] !== ',' && (space(), ['from', a, expr(SEQ + 1)]));

// 'as' for aliasing: * as X, { a as b }. False in prefix for identifier fallback
token('as', SEQ + 2, a => !a ? false : (space(), ['as', a, expr(SEQ + 2)]));

// import: prefix that parses specifiers + from + path
keyword('import', STATEMENT, () => (space(), ['import', expr(SEQ)]));

// export: prefix for declarations or re-exports (use STATEMENT to capture const/let/function)
keyword('export', STATEMENT, () => (space(), ['export', expr(STATEMENT)]));

// default: prefix for export default
keyword('default', SEQ + 1, () => (space(), ['default', expr(SEQ)]));

// Compile stubs - import/export are parse-only (no runtime semantics)
import { operator, compile } from '../parse.js';
operator('import', () => () => undefined);
operator('export', () => () => undefined);
operator('from', (a, b) => () => undefined);
operator('as', (a, b) => () => undefined);
operator('default', (a) => compile(a));
