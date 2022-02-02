import { token } from '../parser.js'

// TODO: it should build syntax tree and then be able to convert to:
// - wat source code
// - audio worklet source code
// - direct function eval

// TODO: subscript;

// TODO: extended numbers: 10k 10m


// a | b | c → c(b(a()))
token('|', (a,b) => {}, PREC_PIPE)

// ...x1,y1,...
token('...', (a, list) => !a && (), PREC_CALL)


// ..b, a..b, a..
token('..', (a, list) => a && (), PREC_CALL)


// f(x,y) = a,b,c.
token('=', (a, body) => (a.type === 'call' ? define : assign), PREC_CALL)

// a in 0..100
token('in', (a, range) => (), PREC_IN)


// a,b = b,a
token(',', (a,b) => () )


// . - save state
token('.', (a,b)=>())
