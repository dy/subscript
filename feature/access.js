/**
 * Property access: a.b, a[b], a(b), [1,2,3] - parse half
 * For private fields (#x), see class.js
 */
import { access, binary } from '../parse.js';

const ACCESS = 170;

// a[b]
access('[]', ACCESS);

// a.b
binary('.', ACCESS);

// a(b,c,d), a()
access('()', ACCESS);
