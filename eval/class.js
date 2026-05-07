// Class declarations and expressions - eval half
import { operator, compile } from '../parse.js';

const STATIC = Symbol('static');
const err = msg => { throw Error(msg) };

operator('instanceof', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) instanceof b(ctx)));
operator('class', (name, base, body) => {
  base = base ? compile(base) : null;
  body = body ? compile(body) : null;
  return ctx => {
    const Parent = base ? base(ctx) : Object;
    const cls = function(...args) {
      if (!(this instanceof cls)) return err('Class constructor must be called with new');
      const instance = base ? Reflect.construct(Parent, args, cls) : this;
      if (cls.prototype.__constructor__) cls.prototype.__constructor__.apply(instance, args);
      return instance;
    };
    Object.setPrototypeOf(cls.prototype, Parent.prototype);
    Object.setPrototypeOf(cls, Parent);
    if (body) {
      const methods = Object.create(ctx);
      methods['super'] = Parent;
      const entries = body(methods);
      const items = Array.isArray(entries) && typeof entries[0]?.[0] === 'string' ? entries : [];
      for (const [k, v] of items) {
        if (k === 'constructor') cls.prototype.__constructor__ = v;
        else cls.prototype[k] = v;
      }
    }
    if (name) ctx[name] = cls;
    return cls;
  };
});
operator('static', a => (a = compile(a), ctx => [[STATIC, a(ctx)]]));
