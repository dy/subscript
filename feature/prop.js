/**
 * Minimal property access: a.b, a[b], f() - parse half
 * For array literals, private fields, see member.js
 */
import { access, binary, group } from '../parse.js';

const ACCESS = 170;

// a[b] - computed member access only (no array literal support)
access('[]', ACCESS);

// a.b - dot member access
binary('.', ACCESS);

// (a) - grouping only (no sequences)
group('()', ACCESS);

// a(b,c,d), a() - function calls
access('()', ACCESS);
