const PERIOD = 46, OPAREN = 40, CPAREN = 41, OBRACK = 91, CBRACK = 93, PLUS = 43, MINUS = 45

export let index, current, lastOp

export const parse = (str, tree) => (current=str, index=lastOp=0, tree=expr(), index < current.length ? err() : tree),

// ------------ util
code = () => current.charCodeAt(index), // current char code
char = (n=1) => current.substr(index, n), // skip n chars
err = (msg=char()) => { throw Error('Bad syntax ' + msg + ' at ' + index) },
skip = (is=1, from=index) => { // consume N or until condition matches
  if (typeof is === 'number') index += is
  else while (is(code())) ++index > current.length && err(is) // 1 + true === 2;
  return index > from ? current.slice(from, index) : null
},
space = () => { while (code() <= 32) index++ },

// ------------- expr
// consume operator
operator = (ops, op, prec, l=3) => {
  // memoize by index - saves 20% to perf
  if (index && lastOp && lastOp[3] === index) return lastOp

  // ascending lookup is faster for 1-char operators, longer for 2+ char ops, so we use descending
  while (l) if ((prec=ops[op=char(l--)])!=null) return lastOp = [op, prec, op.length, index] //opinfo
},

expr = (end, prec=-1) => {
  space()

  let cc = code(), op, node, i=0, mapped, from=index

  if (cc === end) return //shortcut

  // parse node by token parsers (direct loop is faster than token.find)
  while (from===index && i < token.length) node = token[i++](cc)

  // unary prefix
  if (from===index) (op = operator(unary)) && (index += op[2], node = [op[0], expr(end, op[1])])

  // postfix handlers allow a.b[c](d).e, postfix operators, literals etc.
  else {
    // this could add perf, but breaks literals
    // if (space(), cc=code(), cc === end) return node
    for (i=0; i < postfix.length;) if ((mapped=postfix[i](node, cc)) !== node) node=mapped, i=0, space(), cc=code(); else i++
  }
  // ALT: seems to be slower
  // else do {space(), cc=code()} while (postfix.find((parse, mapped) => (mapped = parse(node, cc)) !== node && (node = mapped)))

  space()

  // consume expression for current precedence or higher
  while (cc = code() && cc !== end && (op = operator(binary)) && op[1] > prec) {
    node = [op[0], node]
    // consume same-op group, do..while both saves op lookups and space
    do { index += op[2], node.push(expr(end, op[1])) } while (char(op[2]) === op[0])
    space()
  }

  return node;
},

// ------------------- tokens
// 1.2e+3, .5 - fast & small version, but consumes corrupted nums as well
float = (number) => {
  if (number = skip(c => (c >= 48 && c <= 57) || c === PERIOD)) {
    if (code() === 69 || code() === 101) number += skip(2) + skip(c => c >= 48 && c <= 57)
    return isNaN(number = parseFloat(number)) ? err() : number
  }
},

// "a"
string = (q, qc) => q === 34 ? (qc = char(), index++, qc) + skip(c => c-q) + (index++, qc) : null,

// (...exp)
group = (c, node) => c === OPAREN ? (index++, node = expr(CPAREN), index++, node) : null,

// var or literal
id = name => (name = skip(c =>
  (
    (c >= 48 && c <= 57) || // 0..9
    (c >= 65 && c <= 90) || // A...Z
    (c >= 97 && c <= 122) || // a...z
    c == 36 || c == 95 || // $, _,
    c >= 192 // any non-ASCII
  )
)),

// ----------- config
token = parse.token = [ float, group, string, id ],

literal = parse.literal = {true:true, false:false, null:null},

postfix = parse.postfix = [
  // a.b[c](d), 3 in 1 for performance
  (node, cc, arg) => {
    if (cc === PERIOD) index++, space(), node = ['.', node, '"'+id()+'"']
    else if (cc === OBRACK) index++, node = ['.', node, expr(CBRACK)], index++
    else if (cc === OPAREN)
      index++, arg=expr(CPAREN), code() !== CPAREN && err(),
      node = Array.isArray(arg) && arg[0]===',' ? (arg[0]=node, arg) : arg == null ? [node] : [node, arg],
      index++
    return node
  },

  // a++, a--
  (node, cc) => (cc===0x2b || cc===0x2d) && current.charCodeAt(index+1)===cc ? [skip(2), node] : node,

  // literal
  (node) => typeof node === 'string' && literal.hasOwnProperty(node) ? literal[node] : node
],

unary = parse.unary = {
  '-': 17,
  '!': 17,
  '+': 17,
  '++': 17,
  '--': 17
},

binary = parse.binary = {
  ',': 1,
  '||': 6, '&&': 7, '|': 8, '^': 9, '&': 10,
  '==': 11, '!=': 11,
  '<': 12, '>': 12, '<=': 12, '>=': 12,
  '<<': 13, '>>': 13, '>>>': 13,
  '+': 14, '-': 14,
  '*': 15, '/': 15, '%': 15
}


export default parse
