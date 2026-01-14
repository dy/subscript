/**
 * Comments: block and line
 * Extends parse.space to skip comments as whitespace
 */
import { SPACE } from "../src/const.js";
import { parse, cur, idx, seek } from '../src/parse.js';

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
