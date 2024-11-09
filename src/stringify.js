// convert ast to code string (codegen)

// FIXME: possible enhancements
// * pairs via options
// * custom spacing/newlines (`a.b` vs `a + b` vs `a, b` vs `a; b`)
// * newlines?
// * custom literals?
export default function stringify(node) {
  if (!node) return ''

  if (Array.isArray(node)) {
    const [op, ...args] = node;

    // 1, "x"
    if (!op) return JSON.stringify(args[0])

    // (a), a(b)
    if (op == '[]' || op == '{}' || op == '()') return (args.length > 1 ? stringify(args.shift()) : '') + op[0] + (stringify(args[0])) + op[1]

    // +a
    if (args.length === 1) return op + stringify(args[0])

    // a + b
    if (args.length === 2) return stringify(args[0]) + (op === '.' ? op : (' ' + op + ' ')) + stringify(args[1])

    // a; b; c
    return args.filter(Boolean).map(a => stringify(a)).join(op + '\n')
  }

  return node;
}
