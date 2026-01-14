/**
 * Property access and function calls: a.b, a[b], a(b)
 */
import { access, binary } from '../src/parse.js';

const ACCESS = 170;

// a[b]
access('[]', ACCESS);

// a.b
binary('.', ACCESS);

// a(b,c,d), a()
access('()', ACCESS);
