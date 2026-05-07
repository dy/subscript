/**
 * Collection literals: arrays and objects (Justin feature) - parse half
 *
 * [a, b, c]
 * {a: 1, b: 2}
 * {a, b} (shorthand)
 */
import { group, binary, parse, peek } from '../parse.js';

const ASSIGN = 20, TOKEN = 200;

// Allow {keyword: value} - prevent keyword match before colon
parse.prop = pos => peek(pos) !== 58;

// [a,b,c]
group('[]', TOKEN);

// {a:1, b:2, c:3}
group('{}', TOKEN);

// a: b (colon operator for object properties)
binary(':', ASSIGN - 1, true);
