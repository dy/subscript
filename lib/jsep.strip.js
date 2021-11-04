const isDigit = c => c >= 48 && c <= 57, // 0...9,
  isIdentifierStart = c => (c >= 65 && c <= 90) || // A...Z
      (c >= 97 && c <= 122) || // a...z
      (c == 36 || c == 95) || // $, _,
      c >= 192, // any non-ASCII
  isIdentifierPart = c => isIdentifierStart(c) || isDigit(c),
  isSpace = c => c <= 32,
  isNotQuote = c => !quotes[String.fromCharCode(c)],

  // get precedence
  oper = (op, ops=binary, i, c=0) => { for (i=ops.length;i--;) if (ops[i][op]) return i+1 },

  PERIOD= 46, // '.'
  COMMA=  44, // ','
  OPAREN= 40, // (
  CPAREN= 41, // )
  OBRACK= 91, // [
  CBRACK= 93, // ]
  SEMCOL= 59, // ;
  COLON=  58 // :

export const literals = {
  true: true,
  false: false,
  null: null
},

quotes = {'"':'"'},
comments = {},

unary = [{ // prefix
  '!':a=>!a,
  '+':a=>+a,
  '-':a=>-a,
  '++':a=>++a,
  '--':a=>--a
}, { // postfix
}],

binary = [
  {'||':(a,b)=>a||b},
  {'&&':(a,b)=>a&&b},
  {'|':(a,b)=>a|b},
  {'^':(a,b)=>a^b},
  {'&':(a,b)=>a&b},
  {
    '!=':(a,b)=>a!=b,
    '==':(a,b)=>a==b,
  },
  {
    '>=':(a,b)=>a>=b,
    '>':(a,b)=>a>b,
    '<=':(a,b)=>a<=b,
    '<':(a,b)=>a<b,
  },
  {
    '>>>':(a,b)=>a>>>b,
    '>>':(a,b)=>a>>b,
    '<<':(a,b)=>a<<b,
  },
  {
    '+':(a,b)=>a+b,
    '-':(a,b)=>a-b,
  },
  {
    '%':(a,b)=>a%b,
    '/':(a,b)=>a/b,
    '*':(a,b)=>a*b,
  },
],

parse = (expr, index=0, len=expr.length) => {
  const char = () => expr.charAt(index),
  code = () => expr.charCodeAt(index),
  err = (message) => { throw new Error(message + ' at character ' + index) },

  // skip index until condition matches
  skip = (f, c=code()) => { while (index < len && f(c)) c=expr.charCodeAt(++index); return index },

  // skip index, returning skipped part
  gobble = f => expr.slice(index, skip(f)),

  gobbleSequence = (end) => {
    let list = [], cc;
    let c = 0
    while (index < len && (cc=code()) !== end) {
      if (cc === SEMCOL || cc === COMMA) index++; // ignore separators
      else list.push(gobbleExpression()), skip(isSpace)
    }
    if (end) index++

    return list.length<2?list[0]:list;
  },

  gobbleOp = (ops=binary, op, l=3) => {
    skip(isSpace);
    while (!oper(op=expr.substr(index, l--),ops)) if (!l) return
    index+=op.length
    return op
  },

  /**
   * This function is responsible for gobbling an individual expression,
   * e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
   */
  gobbleExpression = () => {
    let node, op, prec, stack, op_info, left, right, i, curOp;

    // First, try to get the leftmost thing
    // Then, check to see if there's a binary operator operating on that leftmost thing
    // Don't gobbleOp without a left-hand-side
    if (!(left = gobbleToken())) return;
    if (!(op = gobbleOp())) return left;
    if (!(right = gobbleToken())) err("Expected expression after " + op);

    // Otherwise, start a stack to properly place the binary operations in their precedence structure
    stack = [left, [ op, oper(op)||0 ], right];

    // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
    // Basically stripped from jsep, not much mind given optimizing, but good enough
    while ((curOp = gobbleOp())&&(prec = oper(curOp))) {
      // Reduce: make a binary expression from the three topmost entries.
      while ((stack.length > 2) && stack[stack.length-2][1] >= prec) {
        right = stack.pop(), op = stack.pop()[0], left = stack.pop();
        stack.push([op, left, right]); // BINARY_EXP
      }
      node = gobbleToken(); if (!node) err("Expected expression after " + curOp);
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
  gobbleToken = () => {
    let cc, c, op, node;
    skip(isSpace);

    cc = code(), c = char()

    // Char code 46 is a dot `.` which can start off a numeric literal
    if (isDigit(cc) || cc === PERIOD) node = gobbleNumber();
    else if (!isNotQuote(cc)) index++, node = new String(gobble(isNotQuote)), index++ // string literal
      // FIXME: make non-node array literal - maybe wrap nodes somehow?
    else if (cc === OBRACK) index++, node = [Array].concat(gobbleSequence(CBRACK)||[]) // array
    else if (cc === OPAREN) index++, node = gobbleSequence(CPAREN) // group
    else if (isIdentifierStart(cc)) node = gobble(isIdentifierPart); // LITERAL, TODO: map literal after
    else if (op = gobbleOp(unary)) {
      if (!(node = gobbleToken())) err('missing unaryOp argument');
      return [op, node] // UNARY_EXP
    }
    if (!node) return

    // a.b[c](d)
    while (skip(isSpace), cc=code(), cc === PERIOD || cc === OBRACK || cc === OPAREN) {
      index++, skip(isSpace);
      if (cc === OBRACK) node = ['[', node].concat(gobbleSequence(CBRACK)||[]) // MEMBER_EXP
      else if (cc === OPAREN) node = [node].concat(gobbleSequence(CPAREN)||[]) // CALL_EXP
      else if (cc === PERIOD) node = ['.', node, gobble(isIdentifierPart)] // MEMBER_EXP
    }

    return node;
  },

  /**
   * Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
   * keep track of everything in the numeric literal and then calling `parseFloat` on that string
   * @returns {jsep.Literal}
   */
  gobbleNumber = () => {
    let number = '', c, cc;

    number += gobble(isDigit)

    if (code() === PERIOD) number += expr.charAt(index++) + gobble(isDigit) // .1

    c = char();
    if (c === 'e' || c === 'E') { // exponent marker
      number += c, index++
      c = char();
      if (c === '+' || c === '-') number += c, index++; // exponent sign
      number += gobble(isDigit)
    }

    return new Number(number) //  LITERAL
  }

  return gobbleSequence();
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
