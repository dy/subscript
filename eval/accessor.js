// Object accessor properties (getters/setters) - eval half
import { operator, compile } from '../parse.js';

// Accessor marker for object property definitions
export const ACC = Symbol('accessor');

operator('get', (name, body) => {
  body = body ? compile(body) : () => {};
  return ctx => [[ACC, name, {
    get: function() { const s = Object.create(ctx || {}); s.this = this; return body(s); }
  }]];
});

operator('set', (name, param, body) => {
  body = body ? compile(body) : () => {};
  return ctx => [[ACC, name, {
    set: function(v) { const s = Object.create(ctx || {}); s.this = this; s[param] = v; body(s); }
  }]];
});
