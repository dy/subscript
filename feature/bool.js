import { token, err } from "../parse/pratt.js";

const TOKEN = 200;

token('true', TOKEN, a => a ? err() : [, true]);
token('false', TOKEN, a => a ? err() : [, false]);
