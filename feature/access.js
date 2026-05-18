/**
 * Property access: a.b, a[b], a(b), [1,2,3] - parse half
 * For private fields (#x), see class.js
 */
import { access, cur, err, expr, idx, next, parse, skip, token } from '../parse.js';

const ACCESS = 170;
const HASH = 35, _0 = 48, _9 = 57;

// a[b]
access('[]', ACCESS);

// a.b
token('.', ACCESS, a => {
  if (!a) return;

  parse.space();
  if (cur.charCodeAt(idx) === HASH) {
    skip();
    const id = next(parse.id);
    return id ? ['.', a, '#' + id] : err('Expected property name');
  }

  const cc = cur.charCodeAt(idx);
  const prop = cc >= _0 && cc <= _9 ? expr(ACCESS) : next(parse.id) || expr(ACCESS);
  return ['.', a, prop || err('Expected property name')];
});

// a(b,c,d), a()
access('()', ACCESS);
