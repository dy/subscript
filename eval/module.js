// Import/Export - eval stubs (parse-only semantics)
import { operator, compile } from '../parse.js';

operator('import', () => () => undefined);
operator('export', () => () => undefined);
operator('from', (a, b) => () => undefined);
operator('as', (a, b) => () => undefined);
operator('default', (a) => compile(a));
