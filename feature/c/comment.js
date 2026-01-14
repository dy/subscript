/**
 * Comments (C-family): // line and slash-star block
 *
 * Extends parse.space to skip C-style comments as whitespace.
 */
import { parse, cur, idx, seek } from '../../parse/pratt.js';

const SPACE = 32, SLASH = 47, STAR = 42;

const prevSpace = parse.space;
parse.space = () => {
  for (var cc, c2; (cc = prevSpace()) === SLASH; )
    if ((c2 = cur.charCodeAt(idx + 1)) === STAR) { // /*
      for (var i = idx + 2; cur[i] && !(cur.charCodeAt(i) === STAR && cur.charCodeAt(i + 1) === SLASH); i++);
      seek(cur[i] ? i + 2 : i);
    } else if (c2 === SLASH) { // //
      for (var i = idx + 2; cur.charCodeAt(i) >= SPACE; i++);
      seek(i);
    } else return cc;
  return cc;
};
