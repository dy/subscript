import { token, err } from "../src/parse.js";
import { PREC_TOKEN } from "../src/const.js";

token('true', PREC_TOKEN, a => a ? err() : [, true]);
token('false', PREC_TOKEN, a => a ? err() : [, false]);
