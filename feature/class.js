// Class declarations and expressions
// class A extends B { ... }
import { unary, expr, space, next, parse, literal, word, operator, compile } from '../parse.js';
import { keyword, block } from './block.js';

const TOKEN = 200, PREFIX = 140;
const STATIC = Symbol('static');

// super → literal
literal('super', Symbol.for('super'));

// static member → ['static', member]
unary('static', PREFIX);

// class [Name] [extends Base] { body }
keyword('class', TOKEN, () => {
  space();
  let name = next(parse.id) || null;
  // 'extends' parsed as name? → anonymous class
  if (name === 'extends') name = null;
  else {
    space();
    if (!word('extends')) return ['class', name, null, block()];
  }
  space();
  return ['class', name, expr(TOKEN), block()];
});

// Compile
const err = msg => { throw Error(msg) };
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
