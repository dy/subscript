/**
 * Property access: a.b, a[b], a(b), [1,2,3] - parse half
 * For private fields (#x), see class.js
 */
import { access, member } from '../parse.js';

// A call binds looser than member access (`.` `[]`): the JS grammar puts them
// on separate levels so `new` can sit between — see feature/op/unary.js.
const ACCESS = 170, CALL = 160;

// a[b]
access('[]', ACCESS);

// a.b - property name is an IdentifierName (reserved words allowed)
member('.', ACCESS);

// a(b,c,d), a()
access('()', CALL);
