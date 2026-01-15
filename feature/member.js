/**
 * Property access and function calls: a.b, a[b], a(b), #private
 */
import { access, binary, token, next, parse, lookup, idx, skip } from '../parse/pratt.js';

const ACCESS = 170, TOKEN = 200;

// a[b]
access('[]', ACCESS);

// a.b
binary('.', ACCESS);

// a(b,c,d), a()
access('()', ACCESS);

// #private fields: #x → '#x' (identifier starting with #)
token('#', TOKEN, a => {
  if (a) return;
  const id = next(parse.id);
  return id ? '#' + id : void 0;
});
