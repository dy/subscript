// ASI: newline at `;` precedence level triggers nary `;`
import { parse, prec, cur, idx, seek } from '../parse.js';

// Set prec.asi before importing to customize (default: prec[';'])
const lvl = prec.asi ?? prec[';'];

const SPACE = 32, LF = 10, SEMI = 59, space = parse.space;

const lineBreak = (i = idx, c) => {
  while ((c = cur.charCodeAt(i)) <= SPACE) {
    if (c === LF) return true;
    i++;
  }
};

parse.space = () => {
  let cc;
  while ((cc = space()) === SEMI && lineBreak(idx + 1)) {
    seek(idx + 1);
    parse.newline = true;
  }
  return cc;
};

let asiDepth = 0;
const MAX_ASI_DEPTH = 100;

parse.asi = (a, p, expr, b, items) => {
  if (p >= lvl || asiDepth >= MAX_ASI_DEPTH) return;
  // Bail if the inner expr didn't actually consume anything. Without this, a
  // lookup handler that returns a non-array sentinel (e.g. switch.js's
  // `reserve` flagging `case`/`default` inside a switch body) lets expr return
  // a truthy token without advancing idx, and the outer ASI loop appends to its
  // semicolon-list forever.
  const beforeIdx = idx;
  asiDepth++;
  try { b = expr(lvl - .5); }
  finally { asiDepth--; }
  if (!b || idx === beforeIdx) return;
  items = b?.[0] === ';' ? b.slice(1) : [b];
  return a?.[0] === ';' ? (a.push(...items), a) : [';', a, ...items];
};
