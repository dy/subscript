/**
 * Regex literals: /pattern/flags - parse half
 *
 * AST (constructor form, JSON-serializable):
 *   /abc/gi  → ['//', 'abc', 'gi']
 *   /abc/    → ['//', 'abc']
 *
 * Disambiguates from division by context:
 *   - `/` after value = division (falls through to prev)
 *   - `/` at start or after operator = regex
 */
import { token, skip, err, next, idx, cur } from '../parse.js';

const SLASH = 47, BSLASH = 92, LBRACK = 91, RBRACK = 93;

token('/', 140, a => {
  // left operand = division; `//` `/*` `/?` `/+` `/=` = not a regex start
  const c = cur.charCodeAt(idx);
  if (a || c === SLASH || c === 42 || c === 43 || c === 63 || c === 61) return;
  let cls = false;
  const pattern = next(c =>
    c === BSLASH ? 2 :
    c === LBRACK ? (cls = true, 1) :
    c === RBRACK ? (cls = false, 1) :
    c && (cls || c !== SLASH)
  );
  cur.charCodeAt(idx) === SLASH || err('Unterminated regex');
  skip();
  const flags = next(c => c === 103 || c === 105 || c === 109 || c === 115 || c === 117 || c === 121); // gimsuy
  return flags ? ['//', pattern, flags] : ['//', pattern];
});
