// BigInt literals - eval half: ['n', '123'] → 123n
import { operator } from '../parse.js';

operator('n', d => {
  const v = BigInt(d);
  return () => v;
});
