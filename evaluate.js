// evaluate ast tree
export const evaluate = tree => (tree.eval || (tree.eval=compile(tree)))(ctx)

// build optimized evaluator for the tree
export const compile = (node) => {
  const [op, a, b] = node

  // literal
  if (!a) return ctx => op

  a = compile(a)

  // TODO: flatten static unaries/binaries

  // unary
  if (!b) return ctx => reduce(a(ctx))

  b = compile(b)

  // binary
  return ctx => reduce(a(ctx), b(ctx))
}

// operators dict
export const operator = {

}

