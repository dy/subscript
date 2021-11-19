const PERIOD = 46, OPAREN = 40, CPAREN = 41, OBRACK = 91, CBRACK = 93, PLUS = 43, MINUS = 45

export let index, current, lastOp, end

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

expr = (prec=-1, curEnd) => {
  space()

  let cc = code(), op, node, i=0, mapped, from=index, prevEnd
  if (cc === end) return //shortcut

  if (curEnd) prevEnd = end, end = curEnd // global end marker saves operator lookups

  // parse node by token parsers (direct loop is faster than token.find)
  while (from===index && i < token.length) node = token[i++](cc)

  // unary prefix
  if (from===index) (op = operator(unary)) && (index += op[2], node = [op[0], expr(op[1])])

  // postfix handlers
  else {
    for (space(), cc=code(), i=0; i < postfix.length;)
      if ((mapped = postfix[i](node, cc)) !== node) node = mapped, space(), cc=code(); else i++
  }
  // ALT: seems to be slower
  // else do {space(), cc=code()} while (postfix.find((parse, mapped) => (mapped = parse(node, cc)) !== node && (node = mapped)))

  // consume binary expression for current precedence or higher
  while (cc = code() && (cc !== end) && (op = operator(binary)) && op[1] > prec) {
    node = [op[0], node]
    // consume same-op group, do..while both saves op lookups and space
    do { index += op[2], node.push(expr(op[1])) } while (char(op[2]) === op[0])
    space()
  }

  if (curEnd) end = code() !== curEnd ? err() : prevEnd

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
group = (c, node) => c === OPAREN ? (index++, node = expr(-1,CPAREN), index++, node) : null,

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
  // postfix parsers merged into 1 for performance & compactness
  (node, cc, arg) => {
    // a.b[c](d)
    if (cc === PERIOD) index++, space(), node = ['.', node, '"'+id()+'"']
    else if (cc === OBRACK) index++, node = ['.', node, expr(-1,CBRACK)], index++
    else if (cc === OPAREN)
      index++, arg=expr(-1,CPAREN),
      node = Array.isArray(arg) && arg[0]===',' ? (arg[0]=node, arg) : arg == null ? [node] : [node, arg],
      index++

    // a++, a--
    else if ((cc===0x2b || cc===0x2d) && current.charCodeAt(index+1)===cc) node = [skip(2), node]

    // literal
    else if (typeof node === 'string' && literal.hasOwnProperty(node)) node = literal[node]

    return node
  }
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
