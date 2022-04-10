// build optimized evaluator for the tree
export const compile = (node) => !Array.isArray(node) ? ctx => ctx?.[node] : operator[node[0]](...node.slice(1))

const operator = {}

compile.operator = (op, fn, prev=operator[op]) => operator[op] = (...args) => fn(...args) || prev && prev(...args)
compile.binary = (op, fn) => compile.operator(op,
  (a,b) => b && (a=compile(a),b=compile(b), !a.length&&!b.length ? (a=fn(a(),b()),()=>a) : ctx => fn(a(ctx),b(ctx)))
)
compile.unary = (op, fn) => compile.operator(op, (a,b) => !b && (a=compile(a), !a.length ? (a=fn(a()),()=>a) : ctx => fn(a(ctx))))
compile.nary = (op, fn) => compile.operator(op, (...args) => (args=args.map(compile), ctx => fn(...args.map(arg=>arg(ctx)))))

export default compile
