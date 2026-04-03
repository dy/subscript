// Additional JS statements: debugger, with (parse-only)
// debugger → ['debugger']
// with (obj) body → ['with', obj, body]
import { space, keyword, parens } from '../parse.js';
import { body } from './if.js';

const STATEMENT = 5;

// debugger statement
keyword('debugger', STATEMENT + 1, () => ['debugger']);

// with statement
keyword('with', STATEMENT + 1, () => (space(), ['with', parens(), body()]));
