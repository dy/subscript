/**
 * Automatic Semicolon Insertion (ASI)
 *
 * JS-style ASI: insert virtual ; when newline precedes illegal token at statement level
 */
import { parse } from '../parse/pratt.js';

const STATEMENT = 5;

parse.asi = (token, prec, expr) => {
  if (prec >= STATEMENT) return; // only at statement level
  const next = expr(STATEMENT - .5);
  if (!next) return;
  return token?.[0] !== ';' ? [';', token, next] : (token.push(next), token);
};
