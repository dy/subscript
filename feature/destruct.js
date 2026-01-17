/**
 * Destructuring patterns and binding
 *
 * Handles: [a, b] = arr, {x, y} = obj, [a, ...rest] = arr, {x = default} = obj
 */
import { compile } from '../parse.js';

// Destructure value into context
export const destructure = (pattern, value, ctx) => {
  if (typeof pattern === 'string') { ctx[pattern] = value; return; }
  const [op, ...items] = pattern;
  if (op === '{}') {
    for (const item of items) {
      let key, binding, def;
      if (item[0] === '=') [, [, key, binding], def] = item;
      else [, key, binding] = item;
      let val = value[key];
      if (val === undefined && def) val = compile(def)(ctx);
      destructure(binding, val, ctx);
    }
  } else if (op === '[]') {
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
