// Spread/rest operator - eval half (for arrays/objects spread)
import { operator, compile } from '../../parse.js';

operator('...', a => (a = compile(a), ctx => Object.entries(a(ctx))));
