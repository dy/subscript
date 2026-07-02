/** Configurable comments via parse.comment = { start: end } */
import { parse, cur, idx, seek } from '../parse.js';

const space = parse.space;

// Default C-style comments
parse.comment ??= { '//': '\n', '/*': '*/' };

// Reads parse.comment live — no derived cache to go stale when the config is
// extended after load (shebang.js) or reconfigured between parses.
parse.space = () => {
  for (var cc, cm, s, e, i; (cc = space()); ) {
    for (s in cm = parse.comment) {
      if (cc === s.charCodeAt(0) && (s.length < 2 || cur.charCodeAt(idx + 1) === s.charCodeAt(1)) && (s.length < 3 || cur.substr(idx, s.length) === s)) {
        e = cm[s], i = cur.indexOf(e, idx + s.length);
        // line comments stop before their `\n` (ASI reads it); others consume the end mark
        seek(i < 0 ? cur.length : e === '\n' ? i : i + e.length);
        cc = 0; break;
      }
    }
    if (cc) return cc;
  }
  return cc;
};
