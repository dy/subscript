/**
 * jessie: Practical JS subset
 *
 * Builds on justin with statements: blocks, variables, if/else,
 * loops, functions, try/catch, switch, throw.
 *
 * ASI (Automatic Semicolon Insertion) configured via parse.asi hook.
 */
import './justin.js';

// C-family statement features
import '../feature/c/if.js';
import '../feature/c/loop.js';
import '../feature/c/try.js';    // try/catch/finally/throw
import '../feature/c/switch.js';

// Universal statement features
import '../feature/var.js';
import '../feature/function.js';
import '../feature/regex.js';

// JS-specific statement features
import '../feature/js/destruct.js';
import '../feature/js/module.js';
import '../feature/js/accessor.js';

import { parse } from './pratt.js';

// JS ASI handler: insert virtual ; when newline precedes illegal token at statement level
const STATEMENT = 5;
parse.asi = (token, prec, expr) => {
  if (prec >= STATEMENT) return; // only at statement level
  const next = expr(STATEMENT - .5);
  if (!next) return;
  return token?.[0] !== ';' ? [';', token, next] : (token.push(next), token);
};

export * from './pratt.js';
export default parse;
