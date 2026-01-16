// Switch/case/default
// AST: ['switch', val, [';', ['case', test], stmts..., ['default'], stmts...]]
import { expr, skip, space, parens } from '../parse/pratt.js';
import { keyword, block } from './block.js';

const STATEMENT = 5, ASSIGN = 20, COLON = 58;

keyword('switch', STATEMENT + 1, () => (space(), ['switch', parens(), block()]));
keyword('case', STATEMENT + 1, () => (space(), (c => (space() === COLON && skip(), ['case', c]))(expr(ASSIGN))));
keyword('default', STATEMENT + 1, () => (space() === COLON && skip(), ['default']));
