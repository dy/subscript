// ASI: newline at `;` precedence level triggers nary `;`
import { parse, prec } from '../parse.js';

// Set prec.asi before importing to customize (default: prec[';'])
const lvl = prec.asi ?? prec[';'];

parse.asi = (a, p, expr, b, items) => p < lvl && (b = expr(lvl - .5)) && (
  items = b?.[0] === ';' ? b.slice(1) : [b],
  a?.[0] === ';' ? (a.push(...items), a) : [';', a, ...items]
);
