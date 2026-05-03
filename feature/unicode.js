// Unicode identifier extensions for JS/Jessie source.
// Raw escape spelling is preserved in AST identifiers.
import { parse, cur, idx } from '../parse.js';

const BSLASH = 92, U = 117, LBRACE = 123, RBRACE = 125, MIDDOT = 183;

const id = parse.id,
  hex = c =>
    (c >= 48 && c <= 57) ||
    (c >= 65 && c <= 70) ||
    (c >= 97 && c <= 102),

  uesc = (n = idx + 2, c, cp = 0, i = 0) => {
    if (cur.charCodeAt(idx) !== BSLASH || cur.charCodeAt(idx + 1) !== U) return 0;
    if (cur.charCodeAt(n) === LBRACE) {
      while (hex(c = cur.charCodeAt(++n))) cp = cp * 16 + (c <= 57 ? c - 48 : (c & 31) + 9);
      return n > idx + 3 && cp <= 0x10ffff && cur.charCodeAt(n) === RBRACE ? n - idx + 1 : 0;
    }
    while (i < 4 && hex(cur.charCodeAt(n + i))) i++;
    return i === 4 ? 6 : 0;
  };

parse.id = c => id(c) || c === MIDDOT || uesc();