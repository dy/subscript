import { binary } from "../../src/parse.js";

const ASSIGN = 20;

// arrow functions: a => b, (a, b) => c
binary('=>', ASSIGN, true);
