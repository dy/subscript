// Class declarations and expressions - parse half
// class A extends B { ... }
import { binary, token, expr, space, next, parse, keyword, word, skip, cur, idx } from '../parse.js';
import { block } from './if.js';

const TOKEN = 200, PREFIX = 140, COMP = 90;
const OPAREN = 40, CPAREN = 41, OBRACE = 123, CBRACE = 125;

// static member → ['static', member]
token('static', PREFIX, a => {
  if (a) return;
  space();
  const name = next(parse.id);
  if (!name) return;
  space();
  if (cur.charCodeAt(idx) !== OPAREN) return ['static', name];
  skip();
  const params = expr(0, CPAREN) || null;
  space();
  if (cur.charCodeAt(idx) !== OBRACE) return ['static', ['()', name, params]];
  skip();
  return ['static', [':', name, ['=>', ['()', params], expr(0, CBRACE) || null]]];
});

// instanceof: object instanceof Constructor
binary('instanceof', COMP);

// #private fields: #x → '#x' (identifier starting with #)
token('#', TOKEN, a => {
  if (a) return;
  const id = next(parse.id);
  return id ? '#' + id : void 0;
});

// class [Name] [extends Base] { body }
keyword('class', TOKEN, () => {
  space();
  let name = next(parse.id) || null;
  // 'extends' parsed as name? → anonymous class
  if (name === 'extends') {
    name = null;
    space();
  } else {
    space();
    if (!word('extends')) return ['class', name, null, block()];
    skip(7); // skip 'extends'
    space();
  }
  return ['class', name, expr(TOKEN), block()];
});
