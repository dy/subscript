/**
 * Minimal property access: a.b, a[b], f() - parse half
 * For array literals, private fields, see member.js
 */
import { access, member, group } from '../parse.js';

const ACCESS = 170;

// a[b] - computed member access only (no array literal support)
access('[]', ACCESS);

// a.b - dot member access; property name is an IdentifierName
member('.', ACCESS);

// (a) - grouping only (no sequences)
group('()', ACCESS);

// a(b,c,d), a() - function calls
access('()', ACCESS);
