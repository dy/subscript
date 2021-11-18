import parse from './src/parse.js'
import evaluate from './src/evaluate.js'

export { parse, evaluate }

// code → evaluator
export default s => (s = typeof s == 'string' ? parse(s) : s,  ctx => evaluate(s, ctx))
