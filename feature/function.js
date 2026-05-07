// Function declarations and expressions - parse half
import { space, next, parse, keyword, parens, cur, idx, skip } from '../parse.js';
import { block } from './if.js';

const TOKEN = 200;

keyword('function', TOKEN, () => {
  space();
  // Check for generator: function*
  let generator = false;
  if (cur[idx] === '*') {
    generator = true;
    skip();
    space();
  }
  const name = next(parse.id);
  name && space();
  const node = generator ? ['function*', name, parens() || null, block()] : ['function', name, parens() || null, block()];
  return node;
});
