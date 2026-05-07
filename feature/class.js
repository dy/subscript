// Class declarations and expressions - parse half
// class A extends B { ... }
import { binary, unary, token, expr, space, next, parse, keyword, word, skip } from '../parse.js';
import { block } from './if.js';

const TOKEN = 200, PREFIX = 140, COMP = 90;

// static member → ['static', member]
unary('static', PREFIX);

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
