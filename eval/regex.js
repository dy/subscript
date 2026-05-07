// Regex literals - eval half: ['//', pattern, flags?] → RegExp
import { operator } from '../parse.js';

operator('//', (a, b) => {
  const re = new RegExp(a, b || '');
  return () => re;
});
