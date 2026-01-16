// Class declarations and expressions
// class A extends B { ... }
import { unary, expr, space, next, parse, literal, word } from '../parse/pratt.js';
import { keyword, block } from './block.js';

const TOKEN = 200, PREFIX = 140;

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
