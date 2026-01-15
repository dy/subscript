// Function declarations and expressions
import { token, skip, space, next, parse, expr } from '../parse/pratt.js';

const TOKEN = 200, CPAREN = 41, CBRACE = 125, STATEMENT = 5;

token('function', TOKEN, a => {
  if (a) return;
  space();
  const name = next(parse.id);
  name && space();
  skip();
  const params = expr(0, CPAREN) || null;
  space(); skip();
  return ['function', name, params, expr(STATEMENT - .5, CBRACE) || null];
});
