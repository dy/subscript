// Function declarations and expressions
import { space, next, parse, parens, expr } from '../parse/pratt.js';
import { keyword, block } from './block.js';

const TOKEN = 200;

keyword('function', TOKEN, () => {
  space();
  const name = next(parse.id);
  name && space();
  return ['function', name, parens() || null, block()];
});
