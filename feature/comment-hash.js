// Hash comments: # line only
import { parse, cur, idx, seek } from '../parse/pratt.js';

const SPACE = 32, HASH = 35;

const space = parse.space;
parse.space = () => {
  for (var cc; (cc = space()) === HASH; ) {
    for (var i = idx + 1; cur.charCodeAt(i) >= SPACE; i++);
    seek(i);
  }
  return cc;
};
