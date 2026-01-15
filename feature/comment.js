/** Configurable comments via parse.comment = { start: end } */
import { parse, cur, idx, seek } from '../parse/pratt.js';

const SPACE = 32, space = parse.space;

// Default C-style comments
parse.comment ??= { '//': '\n', '/*': '*/' };

// Cached array: [[start, end, firstCharCode], ...]
let comments;

parse.space = () => {
  if (!comments) comments = Object.entries(parse.comment).map(([s, e]) => [s, e, s.charCodeAt(0)]);
  for (var cc; (cc = space()); ) {
    for (var j = 0, c; c = comments[j++]; ) {
      if (cc === c[2] && cur.substr(idx, c[0].length) === c[0]) {
        var i = idx + c[0].length;
        if (c[1] === '\n') while (cur.charCodeAt(i) >= SPACE) i++;
        else { while (cur[i] && cur.substr(i, c[1].length) !== c[1]) i++; if (cur[i]) i += c[1].length; }
        seek(i); cc = 0; break;
      }
    }
    if (cc) return cc;
  }
  return cc;
};
