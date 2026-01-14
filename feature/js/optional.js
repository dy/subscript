import { token, expr } from '../../src/parse.js';

const ACCESS = 170;

// a?. - optional chain base
token('?.', ACCESS, a => a && ['?.', a]);

// a?.b - optional chain with property
token('?.', ACCESS, (a, b) => a && (b = expr(ACCESS), !b?.map) && ['?.', a, b]);
