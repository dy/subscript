const PERIOD = 46, OPAREN = 40, CPAREN = 41, OBRACK = 91, CBRACK = 93, PLUS = 43, MINUS = 45

export let index, current, lastOp

export const code = () => current.charCodeAt(index), // current char code
char = (n=1) => current.substr(index, n), // next n chars
err = (msg) => { throw Error(msg + ' at ' + index) },
next = (is=1, from=index) => { // number indicates skip & stop (don't check)
  if (typeof is === 'number') index += is
  else while (is(code())) ++index > current.length && err('Unexpected end ' + is) // 1 + true === 2;
  return index > from ? current.slice(from, index) : null
},
space = () => { while (code() <= 32) index++ },

// consume operator that resides within current group by precedence
operator = (ops, op, prec, l=3) => {
  // memoize by index - saves 20% to perf
  if (index && lastOp && lastOp[3] === index) return lastOp

  // ascending lookup is faster 1-char operators, longer for 2+ char ops
  while (l) if ((prec=ops[op=char(l--)])!=null) return lastOp = [op, prec, op.length, index] //opinfo
},

// `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)`
expr = (end, prec=-1) => {
  space()

  let cc = code(), op, c = char(), node, mapped, i=0, pre = parse.token, post = parse.postfix

  // parse node by token parsers
  parse.token.find(token => (node = token(cc)) != null)

  // unary prefix
  if (node == null) (op = operator(parse.unary)) && (index += op[2], node = [op[0], expr(end, op[1])])

  // postfix handlers allow a.b[c](d).e, postfix operators, literals etc.
  else do {space(), cc=code()} while (post.find(parse => (mapped = parse(node, cc)) !== node && (node = mapped)))
  // else {
  //   space(), cc=code()
  //   for (;i < post.length;)
  //     if ((mapped=post[i](node, cc)) !== node) {
  //     node=mapped, i=0, space(), cc=code()
  //   } else i++
  // }
  // else {
  //   space()
  //   while ( cc = code(), cc === PERIOD || cc === OPAREN || cc === OBRACK ) { // .([
  //     index++
  //     if (cc === PERIOD) space(), node = (['.', node, id()])
  //     else if (cc === OBRACK) node = (['.', node, expr(CBRACK)]), index++
  //     else if (cc === OPAREN) node = ([node, expr(CPAREN)]), index++
  //     space()
  //   }
  // }

  space()

  // consume expression for current precedence or group (== highest precedence)
  while ((cc = code()) && cc !== end && (op = operator(parse.binary)) && op[1] > prec) {
    node = [op[0], node]
    // consume same-op group, do..while both saves op lookups and space
    do { index += op[2], node.push(expr(end, op[1])) } while (char(op[2]) === op[0])
    space()
  }

  return node;
},

// tokens
// 1.2e+3, .5
float = (number, c, isDigit) => {
  number = next(isDigit = c => c >= 48 && c <= 57) || ''
  if (code() === PERIOD) index++, number += '.' + next(isDigit)
  if (number) {
    if ((c = code()) === 69 || c === 101) { // e, E
      index++, number += 'e'
      if ((c=code()) === PLUS || c === MINUS) // +-
        number += char(), index++
      number += next(isDigit)
    }
    return parseFloat(number)
  }
},

// "a", 'b'
string = (q, qc) => (q === 34 || q === 39) ? (qc = char(), index++, qc) + next(c => c !== q) + (index++, qc) : null,

// (...exp)
group = (c, node) => c === OPAREN ? (index++, node = expr(CPAREN), index++, node) : null,

id = () => next(c =>
  (c >= 48 && c <= 57) || // 0..9
  (c >= 65 && c <= 90) || // A...Z
  (c >= 97 && c <= 122) || // a...z
  c == 36 || c == 95 || // $, _,
  c >= 192 // any non-ASCII
),

parse = Object.assign(
  str => (current=str, index=lastOp=0, expr()),
  {
    token: [ group, float, string, id ],

    postfix: [
      // true, false, null
      node => (typeof node === 'string') ? node === 'true' ? true : node === 'false' ? false : node === 'null' ? null : node : node,

      // prop/call, for perf - 3 in 1
      (node, cc, arg) => {
        if (cc === PERIOD) index++, space(), node = ['.', node, '"'+id()+'"']
        else if (cc === OBRACK) index++, node = ['.', node, expr(CBRACK)], index++
        else if (cc === OPAREN)
          index++, arg=expr(CPAREN),
          node = Array.isArray(arg) && arg[0]===',' ? (arg[0]=node, arg) : arg == null ? [node] : [node, arg],
          index++
        return node
      },

      // // a.b.c
      // (node, c) => c === PERIOD ? (index++, space(), ['.', node, '"'+id()+'"']) : node,

      // // a[b][c]
      // (node, c) => c === OBRACK ? (index++, node=['.', node, expr(CBRACK)], index++, node) : node,

      // // a(b)(c)
      // (node, c, arg) => c === OPAREN ? (
      //   index++, arg=expr(CPAREN),
      //   node = Array.isArray(arg) && arg[0]===',' ? (arg[0]=node, arg) : arg == null ? [node] : [node, arg],
      //   index++, node
      // ) : node,

      // a++, a--
      (node, c2=code()<<8|current.charCodeAt(index+1)) => (c2===0x2b2b||c2===0x2d2d) ? [next(2), node] : node,
    ],

    unary: {
      '-': 17,
      '!': 17,
      '+': 17,
      '++': 17,
      '--': 17
    },

    binary: {
      ',': 1,
      '||': 6, '&&': 7, '|': 8, '^': 9, '&': 10,
      '==': 11, '!=': 11,
      '<': 12, '>': 12, '<=': 12, '>=': 12,
      '<<': 13, '>>': 13, '>>>': 13,
      '+': 14, '-': 14,
      '*': 15, '/': 15, '%': 15
    }
  }
)

export default parse
