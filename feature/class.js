// Class declarations and expressions
// class A extends B { ... }
import { token, unary, expr, skip, space, next, parse, literal, cur, idx } from '../parse/pratt.js';

const TOKEN = 200, PREFIX = 140, STATEMENT = 5, CBRACE = 125;

// super → literal
literal('super', Symbol.for('super'));

// static member → ['static', member]
unary('static', PREFIX);

// class [Name] [extends Base] { body }
token('class', TOKEN, a => {
  if (a) return;
  space();
  let name = next(parse.id) || null;
  // 'extends' parsed as name? → anonymous class
  if (name === 'extends') name = null;
  else {
    space();
    // extends keyword?
    if (cur.substr(idx, 7) !== 'extends' || parse.id(cur.charCodeAt(idx + 7))) {
      skip(); // {
      return ['class', name, null, expr(STATEMENT - .5, CBRACE) || null];
    }
    skip(7);
  }
  space();
  const base = expr(TOKEN);
  space();
  skip(); // {
  return ['class', name, base, expr(STATEMENT - .5, CBRACE) || null];
});
