/**
 * jessie: Practical JS subset
 *
 * Builds on justin with statements: blocks, variables, if/else,
 * loops, functions, try/catch, switch, throw.
 *
 * ASI (Automatic Semicolon Insertion) configured via parse.asi hook.
 */
import './justin.js';

// Statement features (var.js must come before destruct.js)
import '../feature/var.js';
import '../feature/function.js';
import '../feature/async.js';
import '../feature/class.js';
import '../feature/regex.js';
import '../feature/destruct.js';

// Control flow
import '../feature/if.js';
import '../feature/loop.js';
import '../feature/try.js';
import '../feature/switch.js';

// Module system
import '../feature/module.js';
import '../feature/accessor.js';

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
