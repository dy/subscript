const isDigit = c => c >= 48 && c <= 57, // 0...9,
  isIdentifierStart = c => (c >= 65 && c <= 90) || // A...Z
      (c >= 97 && c <= 122) || // a...z
      (c == 36 || c == 95) || // $, _,
      c >= 192, // any non-ASCII
  isIdentifierPart = c => isIdentifierStart(c) || isDigit(c),
  isSpace = c => c <= 32,
  isNotQuote = c => !quotes[String.fromCharCode(c)],

  // get operator info: [operator, precedence, reducer]
  oper = (op, ops=binary, f, p) => { for (p=0;p<ops.length;) if (f=ops[p++][op]) return [op,p,f] },

  // is calltree node
  isCmd = (a,op) => Array.isArray(a) && a.length && a[0] && (op ? a[0]===op : typeof a[0] === 'string' || isCmd(a[0])),

  // apply transform to node
  tr = (node, t) => isCmd(node) ? (t = transforms[node[0]], t?t(node):node) : node


export const literals = {
  true: true,
  false: false,
  null: null
},

groups = {'(':')','[':']'},
quotes = {'"':'"'},
comments = {},

unary= {
  '-': 1,
  '!': 1,
  '~': 1,
  '+': 1,
  '(': 1,
  '++': 1,
  '--': 1
},

binary= {
  ',': 11,
  '||': 10, '&&': 9, '|': 8, '^': 7, '&': 6,
  '==': 5, '!=': 5, '===': 5, '!==': 5,
  '<': 4, '>': 4, '<=': 4, '>=': 4,
  '<<': 3, '>>': 3, '>>>': 3,
  '+': 2, '-': 2,
  '*': 1, '/': 1, '%': 1,
  '.': .1, '(': .1, '[': .1
},

// unary = [
//   {
//     '(':a=>a[a.length-1], // +(a+b)
//   },
//   {},
//   {
//     '!':a=>!a,
//     '+':a=>+a,
//     '-':a=>-a,
//     '++':a=>++a,
//     '--':a=>--a
//   }
// ],

// postfix = [
//   {
//     '++':a=>a++,
//     '--':b=>b--
//   }
// ],

// // multiple args allows shortcuts, lisp compatible, easy manual eval, functions anyways take multiple arguments
// // parser still generates binary groups - it's safer and clearer
// binary = [
//   {},
//   {
//     '.':(...a)=>a.reduce((a,b)=>a?a[b]:a),
//     '(':(a,...args)=>a(...args),
//     '[':(a,...args)=>a[args.pop()]
//   },
//   {},
//   {
//     '%':(...a)=>a.reduce((a,b)=>a%b),
//     '/':(...a)=>a.reduce((a,b)=>a/b),
//     '*':(...a)=>a.reduce((a,b)=>a*b),
//   },
//   {
//     '+':(...a)=>a.reduce((a,b)=>a+b),
//     '-':(...a)=>a.reduce((a,b)=>a-b),
//   },
//   {
//     '>>>':(a,b)=>a>>>b,
//     '>>':(a,b)=>a>>b,
//     '<<':(a,b)=>a<<b,
//   },
//   {
//     '>=':(a,b)=>a>=b,
//     '>':(a,b)=>a>b,
//     '<=':(a,b)=>a<=b,
//     '<':(a,b)=>a<b,
//   },
//   {
//     '!=':(a,b)=>a!=b,
//     '==':(a,b)=>a==b,
//   },
//   {'&':(a,b)=>a&b},
//   {'^':(a,b)=>a^b},
//   {'|':(a,b)=>a|b},
//   {'&&':(...a)=>a.every(Boolean)},
//   {'||':(...a)=>a.some(Boolean)},
//   {',':true}
// ],

transforms = {
  // [(,a,args] → [a,...args]
  '(': n => n.length < 3 ? n[1] :
    [n[1]].concat(n[2]==='' ? [] : n[2][0]==',' ? n[2].slice(1).map(x=>x===''?undefined:x) : [n[2]]),
  '[': n => ['.', n[1], n[2]], // [(,a,args] → ['.', a, args[-1]]
  // ',': n => n.filter(),
  // '.': s => [s[0],s[1], ...s.slice(2).map(a=>typeof a === 'string' ? `"${a}"` : a)] // [.,a,b → [.,a,'"b"'
},


parse = (expr, index=0, len=expr.length, x=0, curOp, curEnd) => {
  const char = (n=1) => expr.substr(index, n), // get next n chars (as fast as expr[index])
  code = () => expr.charCodeAt(index),
  opinfo = (name='', prec=108) => ({name, prec, index, end:groups[name]}),

  // skip index until condition matches
  skip = is => { while (index < len && is(code())) index++ },

  // skip index, return skipped part
  consume = is => expr.slice(index, (skip(is), index)),

  // consume operator that resides within current group by precedence
  consumeOp = (ops=binary, op, prec, l=3) => {
    if (index >= len) return

    // memoize by index - saves 20% to perf
    if (index && curOp.index === index) return curOp

    // don't look up for end characters - saves 5-10% to perf
    if (curEnd && curEnd === char(curEnd.length)) return

    // if (x>1e2) throw 'Whoops'
    while (l) if (prec=ops[op=char(l--)]) return curOp = opinfo(op, prec)
  },

  // `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)`
  consumeGroup = (group, end=curEnd) => {
    index += group.name.length // group always starts with an operator +-b, a(b, +(b, a+b+c, so we skip it
    if (group.end) curEnd = group.end // also we write root end marker

    skip(isSpace);

    let cc = code(), op,
        node='' // indicates "nothing", or "empty", as in [a,,b] - impossible to get as result of parsing

    // `.` can start off a numeric literal
    if (isDigit(cc) || char() === '.') node = new Number(consumeNumber());
    else if (!isNotQuote(cc)) index++, node = new String(consume(isNotQuote)), index++
    else if (isIdentifierStart(cc)) node = (node = consume(isIdentifierPart)) in literals ? literals[node] : node
    // unaries can't be mixed in binary expressions loop due to operator names conflict, must be parsed before
    else if (op = consumeOp(unary)) node = tr([op.name, consumeGroup(op)])

    skip(isSpace)

    // consume expression for current precedence or group (== highest precedence)
    while ((op = consumeOp(binary)) && (group.end || op.prec < group.prec)) {
      node = [op.name, node, consumeGroup(op)]
      // consume same-op group, that also saves op lookups
      while (char(op.name.length) === op.name) node.push(consumeGroup(op))
      node = tr(node)
      skip(isSpace)
    }

    // if group has end operator eg + a ) or + a ]
    if (group.end) index+=group.end.length, curEnd=end

    return node;
  },

  // `12`, `3.4`, `.5`
  consumeNumber = () => {
    let number = '', c;

    number += consume(isDigit)
    c = char()
    if (c === '.') number += (index++, c) + consume(isDigit) // .1

    c = char();
    if (c === 'e' || c === 'E') { // exponent marker
      number += c, index++
      c = char();
      if (c === '+' || c === '-') number += c, index++; // exponent sign
      number += consume(isDigit)
    }

    return number //  LITERAL
  }

  return consumeGroup(curOp = opinfo())
},

// calltree → result
evaluate = (s, ctx={}, c, op) => {
  if (isCmd(s)) {
    c = s[0]
    if (typeof c === 'string') op = oper(c, s.length<3?unary:binary)
    c = op ? op[2] : evaluate(c, ctx)
    if (typeof c !== 'function') return c

    return c.call(...s.map(a=>evaluate(a,ctx)))
  }
  if (s && typeof s === 'string')
    return quotes[s[0]] ? s.slice(1,-1)
          : s[0]==='@' ? s.slice(1)
          : s in ctx ? ctx[s] : s

  return s
}

// code → evaluator
export default s => (s = typeof s == 'string' ? parse(s) : s,  ctx => evaluate(s, ctx))
