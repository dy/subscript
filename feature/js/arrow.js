import { binary } from "../../parse/pratt.js";

const ASSIGN = 20;

// arrow functions: a => b, (a, b) => c
binary('=>', ASSIGN, true);
