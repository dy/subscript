import { binary } from "../parse/pratt.js";

const ASSIGN = 20, EXP = 130;

binary('**', EXP, true);
binary('**=', ASSIGN, true);
