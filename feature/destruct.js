/**
 * Destructuring patterns and binding
 *
 * Handles: [a, b] = arr, {x, y} = obj, [a, ...rest] = arr, {x = default} = obj
 */
import { compile } from '../parse.js';

// Flatten comma into array: [',', a, b, c] → [a, b, c]
const flatten = items => items[0]?.[0] === ',' ? items[0].slice(1) : items;

// Destructure value into context
export const destructure = (pattern, value, ctx) => {
  if (typeof pattern === 'string') { ctx[pattern] = value; return; }
  const [op, ...raw] = pattern;
  const items = flatten(raw);
  if (op === '{}') {
    for (const item of items) {
      let key, binding, def;
      // Shorthand: {x} → item is 'x'
      // With default: {x = 1} → ['=', 'x', default]
      // Rename: {x: y} → [':', 'x', 'y']
      if (typeof item === 'string') { key = binding = item }
      else if (item[0] === '=') { typeof item[1] === 'string' ? (key = binding = item[1]) : ([, key, binding] = item[1]); def = item[2] }
      else { [, key, binding] = item }
      let val = value[key];
      if (val === undefined && def) val = compile(def)(ctx);
      destructure(binding, val, ctx);
    }
  }
  else if (op === '[]') {
    let i = 0;
    for (const item of items) {
      if (item === null) { i++; continue; }
      if (Array.isArray(item) && item[0] === '...') { ctx[item[1]] = value.slice(i); break; }
      let binding = item, def;
      if (Array.isArray(item) && item[0] === '=') [, binding, def] = item;
      let val = value[i++];
      if (val === undefined && def) val = compile(def)(ctx);
      destructure(binding, val, ctx);
    }
  }
};
