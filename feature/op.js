/**
 * Core operators (convenience re-export)
 *
 * Imports all core operator modules in correct order:
 * - assignment: = += etc (base ops registered first)
 * - logical: ! && || ??
 * - bitwise: | & ^ ~ >> << >>>
 * - comparison: < > <= >=
 * - equality: == != === !==
 * - membership: in of instanceof
 * - arithmetic: + - * / %
 * - pow: ** **=
 * - increment: ++ --
 * - literal: true, false, null, undefined, NaN, Infinity
 *
 * NOTE: Order matters for operator chaining (shorter ops first)
 */
import './op/assignment.js';
import './op/logical.js';
import './op/bitwise.js';
import './op/comparison.js';
import './op/equality.js';
import './op/membership.js';
import './op/arithmetic.js';
import './op/pow.js';
import './op/increment.js';
import './op/literal.js';
