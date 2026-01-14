/**
 * Comments: block and line
 * Extends parse.space to skip comments as whitespace
 */
import { parse, cur, idx, seek } from '../parse/pratt.js';

const SPACE = 32;

const prevSpace = parse.space;
parse.space = () => {
  for (var cc, c2; (cc = prevSpace()) === 47; )
    if ((c2 = cur.charCodeAt(idx + 1)) === 42) { // /*
      for (var i = idx + 2; cur[i] && !(cur.charCodeAt(i) === 42 && cur.charCodeAt(i + 1) === 47); i++);
      seek(cur[i] ? i + 2 : i);
    } else if (c2 === 47) { // //
      for (var i = idx + 2; cur.charCodeAt(i) >= SPACE; i++);
      seek(i);
    } else return cc;
  return cc;
};
