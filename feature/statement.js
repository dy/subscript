// Additional JS statements: debugger, with, labeled statements (parse-only)
// debugger              → ['debugger']
// with (obj) body       → ['with', obj, body]
// label: while (…) …    → [':', label, ['while', …]]
import { parse, keyword, token, parens, expr, word } from '../parse.js';
import { body } from './if.js';

const STATEMENT = 5, ASSIGN = 20;

// debugger statement
keyword('debugger', STATEMENT + 1, () => ['debugger']);

// with statement
keyword('with', STATEMENT + 1, () => (parse.space(), ['with', parens(), body()]));

// Labeled statement: `label: while (…) …`. A control keyword outranks the
// object-property `:`, so the default `:` would parse its right side too low
// to reach the keyword — reading `while` as a plain identifier (method
// shorthand `while(){}`). Register `:` at the property `:` precedence: when an
// identifier is followed by `: <control-keyword>`, parse the right side at
// statement precedence; otherwise decline and let the property `:` handle it.
const control = ['if', 'for', 'while', 'do', 'switch', 'try'];
token(':', ASSIGN - 1, a =>
  typeof a === 'string' && (parse.space(), control.some(w => word(w))) && [':', a, expr(STATEMENT)]
);
