/**
 * Collection literals: arrays and objects (Justin feature)
 *
 * [a, b, c]
 * {a: 1, b: 2}
 * {a, b} (shorthand)
 */
import { group, binary } from '../parse/pratt.js';

const ASSIGN = 20, TOKEN = 200;

// [a,b,c]
group('[]', TOKEN);

// {a:1, b:2, c:3}
group('{}', TOKEN);

// a: b (colon operator for object properties)
binary(':', ASSIGN - 1, true);
