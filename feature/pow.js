import { binary } from "../src/parse.js";

const ASSIGN = 20, EXP = 130;

binary('**', EXP, true);
binary('**=', ASSIGN, true);
