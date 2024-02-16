import { set } from '../src/index.js'
import { PREC_LOR, PREC_LAND, PREC_PREFIX } from '../src/const.js';

set('!', PREC_PREFIX, a => !a)

set('||', PREC_LOR, (...args) => { let i = 0, v; for (; !v && i < args.length;) v = args[i++]; return v })
set('&&', PREC_LAND, (...args) => { let i = 0, v = true; for (; v && i < args.length;) v = args[i++]; return v })
