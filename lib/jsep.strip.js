const isDecimalDigit = c => c >= 48 && c <= 57, // 0...9,
  isIdentifierStart = c => (c >= 65 && c <= 90) || // A...Z
      (c >= 97 && c <= 122) || // a...z
      (c >= 192 && !binary[String.fromCharCode(c)]) || // any non-ASCII that is not an operator
      (c==='36'||c==95), // $, _,
  isIdentifierPart = c => isIdentifierStart(c) || isDecimalDigit(c),
  isSpace = c => c <= 32,
  isNotQuote = c => c != 39 && c != 34,

  PERIOD= 46, // '.'
  COMMA=  44, // ','
  OPAREN= 40, // (
  CPAREN= 41, // )
  OBRACK= 91, // [
  CBRACK= 93, // ]
  SEMCOL= 59, // ;
  COLON=  58, // :

  unary= {
    '-': 1,
    '!': 1,
    '~': 1,
    '+': 1
  },

  binary= {
    '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5,
    '==': 6, '!=': 6, '===': 6, '!==': 6,
    '<': 7, '>': 7, '<=': 7, '>=': 7,
    '<<': 8, '>>': 8, '>>>': 8,
    '+': 9, '-': 9,
    '*': 10, '/': 10, '%': 10
  },

  literals= {
    'true': true,
    'false': false,
    'null': null
  }

export default (expr, index=0, len=expr.length) => {
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

  gobbleBinaryOp = (op, l=3) => {
    skip(isSpace);
    while (!binary[op=expr.substr(index, l--)]) if (!l) return
    index+=op.length
    return op
  },

  /**
   * This function is responsible for gobbling an individual expression,
   * e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
   */
  gobbleExpression = () => {
    let node, biop, prec, stack, biop_info, left, right, i, cur_biop;

    // First, try to get the leftmost thing
    // Then, check to see if there's a binary operator operating on that leftmost thing
    // Don't gobbleBinaryOp without a left-hand-side
    left = gobbleToken(); if (!left) return left;

    biop = gobbleBinaryOp();

    // If there wasn't a binary operator, just return the leftmost node
    if (!biop) return left;

    // Otherwise, we need to start a stack to properly place the binary operations in their
    // precedence structure
    biop_info = { value: biop, prec: binary[biop]||0 };

    right = gobbleToken();

    if (!right) err("Expected expression after " + biop);

    stack = [left, biop_info, right];

    // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
    while ((biop = gobbleBinaryOp())) {
      prec = binary[biop]||0;

      if (!prec) {
        index -= biop.length;
        break;
      }

      biop_info = { value: biop, prec };

      cur_biop = biop;

      // Reduce: make a binary expression from the three topmost entries.
      const comparePrev = prev => prec <= prev.prec;
      while ((stack.length > 2) && comparePrev(stack[stack.length - 2])) {
        right = stack.pop();
        biop = stack.pop().value;
        left = stack.pop();
        node = [biop, left, right] // BINARY_EXP
        stack.push(node);
      }

      node = gobbleToken();

      if (!node) {
        err("Expected expression after " + cur_biop);
      }

      stack.push(biop_info, node);
    }

    i = stack.length - 1;
    node = stack[i];

    while (i > 1) {
      node = [stack[i - 1].value, stack[i-2], node] // BINARY_EXP
      i -= 2;
    }

    return node;
  },

  /**
   * An individual part of a binary expression:
   * e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
   * @returns {boolean|jsep.Expression}
   */
  gobbleToken = () => {
    let cc, c, to_check, tc_len, node;
    skip(isSpace);

    cc = code(), c = char()

    // Char code 46 is a dot `.` which can start off a numeric literal
    if (isDecimalDigit(cc) || cc === PERIOD) node = gobbleNumericLiteral();
    else if (!isNotQuote(cc)) index++, node = new String(gobble(isNotQuote)), index++ // string literal
    else if (cc === OBRACK) index++, node = [Array].concat(gobbleSequence(CBRACK)||[]) // array
    else {
      const MAX_ULEN = 3
      to_check = expr.substr(index, MAX_ULEN);
      tc_len = to_check.length;

      while (tc_len > 0) {
        // Don't accept an unary op when it is an identifier.
        // Unary ops that start with a identifier-valid character must be followed
        // by a non identifier-part valid character
        if (unary[to_check] && (
          !isIdentifierStart(code()) ||
          (index + to_check.length < len && !isIdentifierPart(expr.charCodeAt(index + to_check.length)))
        )) {
          index += tc_len;
          const argument = gobbleToken();
          if (!argument) err('missing unaryOp argument');

          return [to_check, argument] // UNARY_EXP
        }

        to_check = to_check.substr(0, --tc_len);
      }

      if (isIdentifierStart(cc)) node = gobble(isIdentifierPart); // LITERAL, TODO: map literal after
      else if (cc === OPAREN) index++, node = gobbleSequence(CPAREN) // open parenthesis
    }

    if (!node) return

    node = gobbleTokenProperty(node);
    return node;
  },

  gobbleTokenProperty = (node, ch) => {
    while (skip(isSpace), ch=code(), ch === PERIOD || ch === OBRACK || ch === OPAREN) {
      index++, skip(isSpace);
      if (ch === OBRACK) node = ['[', node].concat(gobbleSequence(CBRACK)||[]) // MEMBER_EXP
      else if (ch === OPAREN) node = [node].concat(gobbleSequence(CPAREN)||[]) // CALL_EXP
      else if (ch === PERIOD) node = ['.', node, gobble(isIdentifierPart)] // MEMBER_EXP
    }

    return node;
  },

  /**
   * Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
   * keep track of everything in the numeric literal and then calling `parseFloat` on that string
   * @returns {jsep.Literal}
   */
  gobbleNumericLiteral = () => {
    let number = '', c, cc;

    number += gobble(isDecimalDigit)

    if (code() === PERIOD) number += expr.charAt(index++) + gobble(isDecimalDigit) // .1

    c = char();
    if (c === 'e' || c === 'E') { // exponent marker
      number += c, index++
      c = char();
      if (c === '+' || c === '-') number += c, index++; // exponent sign
      number += gobble(isDecimalDigit)
    }

    return new Number(number) //  LITERAL
  }

  return gobbleSequence();
}

