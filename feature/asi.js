// ASI: layered onto parser via hooks.
// Parser core has no awareness of `;`, newlines, or block ends — everything
// dialect-specific (statement separator, line-break-sensitive call/access,
// `}` as implicit terminator) lives here.
import { parse, prec, cur, idx, seek } from '../parse.js';

const SPACE = 32, LF = 10, SEMI = 59, BLOCK_END = 125, BRACKET = 91, PAREN = 40;
// prec.asi customizable before importing (default: prec[';']).
const lvl = prec.asi ?? prec[';'];

// Cache pristine parse.space / parse.step on first load so re-imports REPLACE
// (not chain) — otherwise `prec.asi=0; await import('./asi.js?v=disabled')`
// would leave previous ASI layers active.
const baseSpace = parse._baseSpace ??= parse.space;
const baseStep = parse._baseStep ??= parse.step;
let lineBreak = false;

// LF immediately preceding the next non-space at i (used to detect `;\n`).
const hasLineBreak = (i, c) => {
  while ((c = cur.charCodeAt(i)) <= SPACE) {
    if (c === LF) return true;
    i++;
  }
  return false;
};

// Override space: scan whitespace region for LFs (parse.js's space is
// LF-agnostic), and swallow `;\n` runs into ASI machinery (avoids deep nary `;`
// recursion on long files). parse.semi records that a hard terminator was
// consumed, so the surrounding expression knows to terminate.
parse.space = (cc, from) => {
  lineBreak = false;
  for (;;) {
    from = idx;
    cc = baseSpace();
    while (from < idx) if (cur.charCodeAt(from++) === LF) { parse.newline = lineBreak = true; break; }
    if (cc === SEMI && hasLineBreak(idx + 1)) {
      seek(idx + 1);
      parse.newline = parse.semi = lineBreak = true;
      continue;
    }
    return cc;
  }
};

// Sub-expression boundary: clear sticky flags on entry so outer state
// doesn't bleed into `(...)`, `[...]`, `{...}`. Top-level parse() also calls
// this with no args.
parse.enter = () => parse.newline = parse.semi = false;

// `}` closes a block — outer context sees an implicit newline.
parse.exit = (p, end) => { if (end === BLOCK_END) parse.newline = true; };

// Wrap iteration step: bail at high prec when `;\n` consumed; fire ASI before
// `[`/`(` on a new line; fire ASI when no operator continues across newline.
parse.step = (a, p, cc, expr) => {
  if (parse.semi && p >= lvl) return false;
  if (a && (parse.semi || ((cc === BRACKET || cc === PAREN) && lineBreak))) return asi(a, p, expr) ?? null;
  const nl = parse.newline;
  return baseStep(a, p, cc, expr) ?? (a && nl ? asi(a, p, expr) ?? null : null);
};

let asiDepth = 0;
const MAX_ASI_DEPTH = 100;

const asi = parse.asi = (a, p, expr, b, items) => {
  if (p >= lvl || asiDepth >= MAX_ASI_DEPTH) return;
  parse.semi = false;
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
