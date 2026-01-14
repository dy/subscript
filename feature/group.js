import { nary, group } from '../parse/pratt.js';

const STATEMENT = 5, SEQ = 10, ACCESS = 170;

// (a,b,c), (a) — uses ACCESS to avoid conflict with ?.
group('()', ACCESS);

// Sequences
nary(',', SEQ);
nary(';', STATEMENT, true);
