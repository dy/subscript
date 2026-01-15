// Slash comments: // line and /* block */
import { parse, cur, idx, seek } from '../parse/pratt.js';

const SPACE = 32, SLASH = 47, STAR = 42;

const space = parse.space;
parse.space = () => {
  for (var cc, c2; (cc = space()) === SLASH; )
    if ((c2 = cur.charCodeAt(idx + 1)) === SLASH) {
      for (var i = idx + 2; cur.charCodeAt(i) >= SPACE; i++);
      seek(i);
    } else if (c2 === STAR) {
      for (var i = idx + 2; cur[i] && !(cur.charCodeAt(i) === STAR && cur.charCodeAt(i + 1) === SLASH); i++);
      seek(cur[i] ? i + 2 : i);
    } else return cc;
  return cc;
};
