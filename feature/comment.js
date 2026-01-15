/**
 * Comments with configurable delimiters
 * parse.comment: { line: '//', block: ['/ *', '* /'] }
 */
import { parse, cur, idx, seek } from '../parse/pratt.js';

const SPACE = 32;

// Default config - cache first char codes for fast-path
parse.comment = { line: '//', block: ['/*', '*/'] };

const space = parse.space;
parse.space = () => {
  const { line, block } = parse.comment;
  // Cache first chars for fast-path check
  const lc = line?.charCodeAt(0), bc = block?.[0].charCodeAt(0);
  for (var cc; (cc = space()); ) {
    // Fast-path: check first char before string compare
    if (cc === lc && cur.substr(idx, line.length) === line) {
      for (var i = idx + line.length; cur.charCodeAt(i) >= SPACE; i++);
      seek(i);
      continue;
    }
    if (cc === bc && cur.substr(idx, block[0].length) === block[0]) {
      for (var i = idx + block[0].length; cur[i] && cur.substr(i, block[1].length) !== block[1]; i++);
      seek(cur[i] ? i + block[1].length : i);
      continue;
    }
    return cc;
  }
  return cc;
};
