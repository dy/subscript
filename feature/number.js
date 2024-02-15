import { lookup, skip, err } from "../src/parse.js"
import { PERIOD, _0, _E, _e, _9 } from "../src/const.js"

// parse number
const num = a => a ? err() : ['', (a = +skip(c => c === PERIOD || (c >= _0 && c <= _9) || (c === _E || c === _e ? 2 : 0))) != a ? err() : a]

// .1
lookup[PERIOD] = a => (!a && num())

// 0-9
for (let i = _0; i <= _9; i++) lookup[i] = num
