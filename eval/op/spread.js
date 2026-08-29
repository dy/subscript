// Spread/rest operator - eval half (for arrays/objects spread)
import { operator, compile } from '../../parse.js';
import { unsafeName } from '../access.js';

operator('...', a => (a = compile(a), ctx => {
  const obj = a(ctx), entries = [];
  for (const key of Object.keys(obj)) if (!unsafeName(key)) entries.push([key, obj[key]]);
  return entries;
}));
