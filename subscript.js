const isDigit = c => c >= 48 && c <= 57, // 0...9,
  isIdentifierStart = c => (c >= 65 && c <= 90) || // A...Z
      (c >= 97 && c <= 122) || // a...z
      (c == 36 || c == 95) || // $, _,
      c >= 192, // any non-ASCII
  isIdentifierPart = c => isIdentifierStart(c) || isDigit(c),
  isSpace = c => c <= 32,

  PERIOD= 46, // '.'
  COMMA=  44, // ','
  OPAREN= 40, // (
  CPAREN= 41, // )
  OBRACK= 91, // [
  CBRACK= 93, // ]
  SEMCOL= 59, // ;
  COLON=  58 // :

export const unary= {
  '-': 1,
  '!': 1,
  '~': 1,
  '+': 1
},

binary= {
  '||': 10, '&&': 9, '|': 8, '^': 7, '&': 6,
  '==': 5, '!=': 5, '===': 5, '!==': 5,
  '<': 4, '>': 4, '<=': 4, '>=': 4,
  '<<': 3, '>>': 3, '>>>': 3,
  '+': 2, '-': 2,
  '*': 1, '/': 1, '%': 1
},

literals= {
  'true': true,
  'false': false,
  'null': null
},

groups = {'(':')','[':']'},
quotes = '"',
comments = {},

transforms = {
  // [(,a,args] → [a,...args]
  '(': n => n.length < 3 ? n[1] :
    [n[1]].concat(n[2]==='' ? [] : n[2][0]==',' ? n[2].slice(1).map(x=>x===''?undefined:x) : [n[2]]),
  '[': n => ['.', n[1], n[2]], // [(,a,args] → ['.', a, args[-1]]
  // ',': n => n.filter(),
  // '.': s => [s[0],s[1], ...s.slice(2).map(a=>typeof a === 'string' ? `"${a}"` : a)] // [.,a,b → [.,a,'"b"'
}


export const parse = (expr, index=0, len=expr.length) => {
  const char = () => expr.charAt(index),
  code = () => expr.charCodeAt(index),
  err = (message) => { throw new Error(message + ' at character ' + index) },

  // skip index until condition matches
  skip = (f) => { while (index < len && f(code())) index++; return index },

  // skip index, returning skipped part
  consume = f => expr.slice(index, skip(f)),

  consumeSequence = (end) => {
    let list = [], cc;
    let c = 0
    while (index < len && (cc=code()) !== end) {
      if (cc === SEMCOL || cc === COMMA) index++; // ignore separators
      else list.push(consumeExpression()), skip(isSpace)
    }
    if (end) index++

    return list.length<2?list[0]:list;
  },

  consumeOp = (ops=binary, op, l=3) => {
    skip(isSpace);
    while (!ops[op=expr.substr(index, l--)]) if (!l) return
    index+=op.length
    return op
  },

  /**
   * This function is responsible for gobbling an individual expression,
   * e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
   */
  consumeExpression = () => {
    let node, op, prec, stack, op_info, left, right, i, curOp;

    // First, try to get the leftmost thing
    // Then, check to see if there's a binary operator operating on that leftmost thing
    // Don't consumeOp without a left-hand-side
    if (!(left = consumeToken())) return;
    if (!(op = consumeOp())) return left;
    if (!(right = consumeToken())) err("Expected expression after " + op);

    // Otherwise, start a stack to properly place the binary operations in their precedence structure
    stack = [left, [ op, binary[op]||0 ], right];

    // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
    // Basically stripped from jsep, not much mind given optimizing, but good enough
    while ((curOp = consumeOp())&&(prec = binary[curOp])) {
      // Reduce: make a binary expression from the three topmost entries.
      while ((stack.length > 2) && stack[stack.length-2][1] <= prec) {
        right = stack.pop(), op = stack.pop()[0], left = stack.pop();
        stack.push([op, left, right]); // BINARY_EXP
      }
      node = consumeToken(); if (!node) err("Expected expression after " + curOp);
      stack.push([curOp, prec], node);
    }

    i = stack.length - 1, node = stack[i];
    while (i > 1) { node = [stack[i-1][0], stack[i-2], node], i-=2 } // BINARY_EXP

    return node;
  },

  /**
   * An individual part of a binary expression:
   * e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
   * @returns {boolean|jsep.Expression}
   */
  consumeToken = () => {
    let cc, c, op, node;
    skip(isSpace);

    cc = code(), c = char()

    // Char code 46 is a dot `.` which can start off a numeric literal
    if (isDigit(cc) || cc === PERIOD) node = new Number(consumeNumber());
    else if (quotes.indexOf(c)>=0) index++, node = new String(consume(c=>c!==cc)), index++ // string literal
    else if (cc === OBRACK) index++, node = [Array].concat(consumeSequence(CBRACK)||[]) // array
    else if (cc === OPAREN) index++, node = consumeSequence(CPAREN) // group
    else if (isIdentifierStart(cc)) node = consume(isIdentifierPart); // LITERAL, TODO: map literal after
    else if ((op = consumeOp(unary))&&unary[op]) {
      if (!(node = consumeToken())) err('missing unaryOp argument');
      return [op, node] // UNARY_EXP
    }
    if (!node) return

    // consumeTokenProperty
    while (skip(isSpace), cc=code(), cc === PERIOD || cc === OBRACK || cc === OPAREN) {
      index++, skip(isSpace);
      if (cc === OBRACK) node = ['[', node].concat(consumeSequence(CBRACK)||[]) // MEMBER_EXP
      else if (cc === OPAREN) node = [node].concat(consumeSequence(CPAREN)||[]) // CALL_EXP
      else if (cc === PERIOD) node = ['.', node, consume(isIdentifierPart)] // MEMBER_EXP
    }

    return node;
  },

  // `12`, `3.4`, `.5`
  consumeNumber = () => {
    let number = '', c;

    number += consume(isDigit)
    if (char() === '.') number += expr.charAt(index++) + consume(isDigit) // .1

    c = char();
    if (c === 'e' || c === 'E') { // exponent marker
      number += c, index++
      c = char();
      if (c === '+' || c === '-') number += c, index++; // exponent sign
      number += consume(isDigit)
    }

    return number //  LITERAL
  }

  return consumeSequence();
},

// calltree → result
evaluate = (s, ctx={},x) => isnode(s)
  ? (x=isnode(s[0]) ? evaluate(s[0], ctx) : typeof s[0]==='string' ? ctx[s[0]]||operator(s[0],s.length-1) : s[0],x)
    (...s.slice(1).map(a=>evaluate(a,ctx)))
  : typeof s == 'string'
  ? quotes[s[0]] ? s.slice(1,-1) : ctx[s]
  : s

// code → evaluator
export default s => (s = typeof s == 'string' ? parse(s) : s,  ctx => evaluate(s, ctx))






// const isDigit = c => c >= 48 && c <= 57, // 0...9,
//   isIdentifierStart = c => (c >= 65 && c <= 90) || // A...Z
//       (c >= 97 && c <= 122) || // a...z
//       (c == 36 || c == 95) || // $, _,
//       c >= 192, // any non-ASCII
//   isIdentifierPart = c => isIdentifierStart(c) || isDigit(c),
//   isSpace = c => c <= 32,
//   isNotQuote = c => !quotes[String.fromCharCode(c)],

//   // get operator info: [operator, precedence, reducer]
//   oper = (op, ops=binary, f, p) => { for (p=0;p<ops.length;) if (f=ops[p++][op]) return [op,p,f] },

//   // is calltree node
//   isCmd = (a,op) => Array.isArray(a) && a.length && a[0] && (op ? a[0]===op : typeof a[0] === 'string' || isCmd(a[0])),

//   // apply transform to node
//   tr = (node, t) => isCmd(node) ? (t = transforms[node[0]], t?t(node):node) : node


// export const literals = {
//   true: true,
//   false: false,
//   null: null
// },

// groups = {'(':')','[':']'},
// quotes = {'"':'"'},
// comments = {},

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

// transforms = {
//   // [(,a,args] → [a,...args]
//   '(': n => n.length < 3 ? n[1] :
//     [n[1]].concat(n[2]==='' ? [] : n[2][0]==',' ? n[2].slice(1).map(x=>x===''?undefined:x) : [n[2]]),
//   '[': n => ['.', n[1], n[2]], // [(,a,args] → ['.', a, args[-1]]
//   // ',': n => n.filter(),
//   // '.': s => [s[0],s[1], ...s.slice(2).map(a=>typeof a === 'string' ? `"${a}"` : a)] // [.,a,b → [.,a,'"b"'
// },


// parse = (expr, index=0, len=expr.length) => {
//   const char = () => expr.charAt(index), code = () => expr.charCodeAt(index),

//   // skip index until condition matches
//   skip = is => { while (index < len && is(code())) index++; return index },

//   // skip index, return skipped part
//   consume = is => expr.slice(index, skip(is)),

//   //
//   parseOp = (ops, l=3, op) => { while (l&&!op) op=oper(expr.substr(index, l--),ops); return op },

//   // `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)`
//   consumeGroup = (curOp) => {
//     skip(isSpace);

//     let cc = code(), op,
//         end = groups[curOp[0]],
//         node='' // indicates "nothing", or "empty", as in [a,,b] - impossible to get as result of parsing

//     // `.` can start off a numeric literal
//     if (isDigit(cc) || char() === '.') node = new Number(consumeNumber());
//     else if (!isNotQuote(cc)) index++, node = new String(consume(isNotQuote)), index++
//     else if (isIdentifierStart(cc)) node = (node = consume(isIdentifierPart)) in literals ? literals[node] : node
//     // unaries can't be mixed in binary expressions loop due to operator names conflict, must be parsed before
//     else if (op = parseOp(unary)) index += op[0].length, node = tr([op[0], consumeGroup(op)])

//     skip(isSpace)

//     // consume expression for current precedence or group (== highest precedence)
//     while ((op = parseOp()) && (op[1] < curOp[1] || end)) {
//       index+=op[0].length
//       // FIXME: same-group arguments should be collected before applying transform
//       isCmd(node) && node.length>2 && op[0] === node[0] ? node.push(consumeGroup(op)) : node = tr([op[0], node, consumeGroup(op)])
//       skip(isSpace)
//     }

//     // if we're at end of group-operator
//     if (end == char()) index++

//     return node;
//   },

//   // `12`, `3.4`, `.5`
//   consumeNumber = () => {
//     let number = '', c;

//     number += consume(isDigit)
//     if (char() === '.') number += expr.charAt(index++) + consume(isDigit) // .1

//     c = char();
//     if (c === 'e' || c === 'E') { // exponent marker
//       number += c, index++
//       c = char();
//       if (c === '+' || c === '-') number += c, index++; // exponent sign
//       number += consume(isDigit)
//     }

//     return number //  LITERAL
//   }

//   return consumeGroup(oper(','))
// },

// // calltree → result
// evaluate = (s, ctx={}, c, op) => {
//   if (isCmd(s)) {
//     c = s[0]
//     if (typeof c === 'string') op = oper(c, s.length<3?unary:binary)
//     c = op ? op[2] : evaluate(c, ctx)
//     if (typeof c !== 'function') return c

//     return c.call(...s.map(a=>evaluate(a,ctx)))
//   }
//   if (s && typeof s === 'string')
//     return quotes[s[0]] ? s.slice(1,-1)
//           : s[0]==='@' ? s.slice(1)
//           : s in ctx ? ctx[s] : s

//   return s
// }

// // code → evaluator
// export default s => (s = typeof s == 'string' ? parse(s) : s,  ctx => evaluate(s, ctx))
