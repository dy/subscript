/** Configurable comments via parse.comment = { start: end } */
import { parse, cur, idx, seek } from '../parse.js';

const SPACE = 32, space = parse.space;

// Default C-style comments
parse.comment ??= { '//': '\n', '/*': '*/' };

// [[start, end, firstCharCode], ...], derived from parse.comment (a config object
// other feature modules may still extend after this file loads — e.g. shebang.js
// adds '#!' — so it can't be derived once at module-eval time). Re-derived at the
// start of EVERY top-level parse() call (idx===0 here means parse() just reset it,
// vs mid-parse where idx has advanced) rather than cached on first use and trusted
// forever: parse.comment has only a couple of entries, so re-deriving is cheap,
// and unlike a build-once cache this can never dangle for an embedder that bump-
// allocates its heap and rewinds it between parses (e.g. a self-hosted compiler
// kernel calling `_clear()` between compiles) — there is no stale state to dangle,
// each parse() derives its own.
let comments;
parse.space = () => {
  if (!idx) comments = Object.entries(parse.comment).map(([s, e]) => [s, e, s.charCodeAt(0)]);
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
