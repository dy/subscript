// ASI: newline at `;` precedence level triggers nary `;`
import { parse, prec } from '../parse.js';

// Set prec.asi before importing to customize (default: prec[';'])
const lvl = prec.asi ?? prec[';'];

let asiDepth = 0;
const MAX_ASI_DEPTH = 100;

parse.asi = (a, p, expr, b, items) => {
  if (p >= lvl || asiDepth >= MAX_ASI_DEPTH) return;
  asiDepth++;
  try { b = expr(lvl - .5); }
  finally { asiDepth--; }
  if (!b) return;
  items = b?.[0] === ';' ? b.slice(1) : [b];
  return a?.[0] === ';' ? (a.push(...items), a) : [';', a, ...items];
};
