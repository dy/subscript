import { token, err } from "../src/parse.js";

const TOKEN = 200;

token('true', TOKEN, a => a ? err() : [, true]);
token('false', TOKEN, a => a ? err() : [, false]);
