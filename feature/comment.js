/** Configurable comments via parse.comment = { start: end } */
import { parse, cur, idx, seek } from '../parse/pratt.js';

const SPACE = 32, space = parse.space;

// cached [[start, end], ...]
let comments = Object.entries(parse.comment || { '//': '\n', '/*': '*/' });

parse.space = () => {
  for (var cc; (cc = space()); ) {
    for (var j = 0, c; c = comments[j++]; ) {
      if (cur.substr(idx, c[0].length) === c[0]) {
        var i = idx + c[0].length;
        if (c[1] === '\n') while (cur.charCodeAt(i) >= SPACE) i++;
        else { while (cur[i] && cur.substr(i, c[1].length) !== c[1]) i++; if (cur[i]) i += c[1].length; }
        seek(i);
        cc = 0; break;
      }
    }
    if (cc) return cc;
  }
  return cc;
};
