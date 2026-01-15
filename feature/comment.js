/**
 * Comments with configurable delimiters
 *
 * Configurable via parse.comment: { line: '//', block: ['/ *', '* /'] }
 */
import { parse, cur, idx, seek } from '../parse/pratt.js';

const SPACE = 32;

// Default config on parse object
parse.comment = { line: '//', block: ['/*', '*/'] };

const space = parse.space;
parse.space = () => {
  const { line, block } = parse.comment;
  for (var cc; (cc = space()); ) {
    // Check line comment
    if (line && cur.slice(idx, idx + line.length) === line) {
      for (var i = idx + line.length; cur.charCodeAt(i) >= SPACE; i++);
      seek(i);
      continue;
    }
    // Check block comment
    if (block && cur.slice(idx, idx + block[0].length) === block[0]) {
      for (var i = idx + block[0].length; cur[i] && cur.slice(i, i + block[1].length) !== block[1]; i++);
      seek(cur[i] ? i + block[1].length : i);
      continue;
    }
    return cc;
  }
  return cc;
};
