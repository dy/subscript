let index, current, end, lastOp

const code = () => current.charCodeAt(index), // current char code
char = (n=1) => current.substr(index, n), // next n chars
err = (msg) => { throw Error(msg + ' at ' + index) },
next = (is, from=index, n) => { // number indicates skip & stop (don't check)
  while (is(code())) ++index > current.length && err('Unexpected end ' + is) // 1 + true === 2;
  return index > from ? current.slice(from, index) : undefined
},
space = () => { while (code() <= 32) index++ },

// consume operator that resides within current group by precedence
operator = (ops, op, prec, l=3) => {
  // memoize by index - saves 20% to perf
  // if (index && lastOp[2] === index) return lastOp

  // ascending lookup is faster 1-char operators, longer for 2+ char ops
  while (l) if ((prec=ops[op=char(l--)])!=null) return lastOp = [op, prec, index] //opinfo
},

isCmd = a => Array.isArray(a) && (typeof a[0] === 'string' || isCmd(a[0])),

// `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)`
expr = (end, curOp = ['', -1]) => {
  // FIXME: try to make argument take only precedence
  // FIXME: excessive here. Try moving back to operator
  index += curOp[0].length // group always starts with an operator +-b, a(b, +(b, a+b+c, so we skip it

  space()

  let cc = code(), op, c = char(), node, from=index, arg
  const PERIOD = 46, OPAREN = 40, CPAREN = 41, OBRACK = 91, CBRACK = 93

  // parse node by token parsers
  parse.token.find(token => (node = token(), index > from))

  // unary
  if (index === from) (op = operator(parse.prefix)) && (node = [op[0], expr(end, op)])

  // literal
  else if (typeof node === 'string' && parse.literal.hasOwnProperty(node)) node = parse.literal[node]

  // chain, a.b[c](d).e − can be treated as single token. Faster & shorter than making ([. a separate operator
  else {
    space()
    while ( cc = code(), cc === PERIOD || cc === OPAREN || cc === OBRACK ) {
      index++
      if (cc === PERIOD) space(), node = ['.', node, float() ?? ('"' + id() + '"')]
      else if (cc === OBRACK) node = ['.', node, expr(CBRACK)], index++
      else if (cc === OPAREN)
        arg = expr(CPAREN), index++,
        node = isCmd(arg) && arg[0]===','? (arg[0]=node, node=arg) : arg == null ? [node] : [node, arg]
      space()
    }
  }

  space()

  // consume expression for current precedence or group (== highest precedence)
  while ((cc = code()) && cc !== end && (op = operator(parse.binary)) && op[1] > curOp[1]) {
    node = [op[0], node]
    // consume same-op group, that also saves op lookups
    while (char(op[0].length) === op[0]) node.push(expr(end, op))
    space()
  }

  return node;
},

// tokens
float = (number, c, e, isDigit) => {
  const E = 69, _E = 101, PLUS = 43, MINUS = 45, PERIOD = 46
  number = next(isDigit = c => c >= 48 && c <= 57) || ''
  if (code() === PERIOD) index++, number += '.' + next(isDigit)
  if (number && ((c = code()) === E || c === _E)) {
    index++, number += 'e'
    if ((c=code()) === PLUS || c === MINUS) number += char(), index++
    number += next(isDigit)
  }
  return number ? parseFloat(number) : undefined
},

string = (q=code(), qc) => (q === 34 || q === 39) && (qc = char(), index++, qc) + next(c => c !== q) + (index++, qc),

group = (open=40, end=41, node) => code() === open && (index++, node = expr(end), index++, node),

id = () => next(c =>
  (c >= 48 && c <= 57) || // 0..9
  (c >= 65 && c <= 90) || // A...Z
  (c >= 97 && c <= 122) || // a...z
  c == 36 || c == 95 || // $, _,
  c >= 192 // any non-ASCII
),

parse = Object.assign(
  str => (current=str, index=0, expr()),
  {
    token: [ group, float, string, id ],

    literal: {
      true: true,
      false: false,
      null: null
    },

    prefix: {
      '-': 10,
      '!': 10,
      '+': 10,
      '++': 10,
      '--': 10
    },
    postfix: {
      '++': 10,
      '--': 10
    },
    binary: {
      ',': 0,
      '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5,
      '==': 6, '!=': 6,
      '<': 7, '>': 7, '<=': 7, '>=': 7,
      '<<': 8, '>>': 8, '>>>': 8,
      '+': 9, '-': 9,
      '*': 10, '/': 10, '%': 10
    }
  }
),

// calltree → result
evaluate = Object.assign((s, ctx={}, c, op) => {
  if (isCmd(s)) {
    c = s[0]
    if (typeof c === 'string') op = evaluate.operator[c]
    c = op || evaluate(c, ctx) // [[a,b], c]
    if (typeof c !== 'function') return c

    return c.call(...s.map(a => evaluate(a,ctx)))
  }
  if (s && typeof s === 'string')
    return s[0] === '"' ? s.slice(1,-1)
          : s[0]==='@' ? s.slice(1)
          : s in ctx ? ctx[s] : s

  return s
}, {
  // op evaluators
  // multiple args allows shortcuts, lisp compatible, easy manual eval, functions anyways take multiple arguments
  operator: {
    '!':a=>!a,
    '++':a=>++a,
    '--':a=>--a,

    '.':(...a)=>a.reduce((a,b)=>a?a[b]:a),

    '%':(...a)=>a.reduce((a,b)=>a%b),
    '/':(...a)=>a.reduce((a,b)=>a/b),
    '*':(...a)=>a.reduce((a,b)=>a*b),

    '+':(...a)=>a.reduce((a,b)=>a+b),
    '-':(...a)=>a.length < 2 ? -a : a.reduce((a,b)=>a-b),

    '>>>':(a,b)=>a>>>b,
    '>>':(a,b)=>a>>b,
    '<<':(a,b)=>a<<b,

    '>=':(a,b)=>a>=b,
    '>':(a,b)=>a>b,
    '<=':(a,b)=>a<=b,
    '<':(a,b)=>a<b,

    '!=':(a,b)=>a!=b,
    '==':(a,b)=>a==b,

    '&':(a,b)=>a&b,
    '^':(a,b)=>a^b,
    '|':(a,b)=>a|b,
    '&&':(...a)=>a.every(Boolean),
    '||':(...a)=>a.some(Boolean),
    ',':(...a)=>a.reduce((a,b)=>(a,b))
  }
})

export { parse, evaluate }

// code → evaluator
export default s => (s = typeof s == 'string' ? parse(s) : s,  ctx => evaluate(s, ctx))

