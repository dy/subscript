// Switch/case/default
// AST: ['switch', val, [';', ['case', test], stmts..., ['default'], stmts...]]
import { token, expr, skip, space } from '../parse/pratt.js';

const STATEMENT = 5, ASSIGN = 20, CBRACE = 125, CPAREN = 41, COLON = 58;

token('switch', STATEMENT + 1, a => !a && (space(), skip(), (v => (space(), skip(), ['switch', v, expr(STATEMENT - .5, CBRACE) || null]))(expr(0, CPAREN))));
token('case', STATEMENT + 1, a => !a && (space(), (c => (space() === COLON && skip(), ['case', c]))(expr(ASSIGN))));
token('default', STATEMENT + 1, a => !a && (space() === COLON && skip(), ['default']));
