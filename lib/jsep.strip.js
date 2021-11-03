const isDecimalDigit = (ch) => (ch >= 48 && ch <= 57), // 0...9,
  isIdentifierStart = (ch) => (ch >= 65 && ch <= 90) || // A...Z
      (ch >= 97 && ch <= 122) || // a...z
      (ch >= 192 && !binary[String.fromCharCode(ch)]) || // any non-ASCII that is not an operator
      (ch==='36'||ch==95), // $, _,
  isIdentifierPart = (ch) => isIdentifierStart(ch) || isDecimalDigit(ch),
  isSpace = ch => ch <= 32,
  isNotQuote = c => c != 39 && c != 34

const PERIOD= 46, // '.'
      COMMA=  44, // ','
      OPAREN= 40, // (
      CPAREN= 41, // )
      OBRACK= 91, // [
      CBRACK= 93, // ]
      QUMARK= 63, // ?
      SEMCOL= 59, // ;
      COLON=  58 // :

const unary= {
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
  err = (message) => {
    const error = new Error(message + ' at character ' + index);
    error.index = index;
    error.description = message;
    throw error;
  },

  // skip index until condition matches
  skip = (f, c=code()) => { while (index < len && f(c)) c=expr.charCodeAt(++index); return index },

  gobbleExpressions = (untilICode) => {
    let nodes = [], ch_i, node;

    while (index < len) {
      ch_i = code();

      // Expressions can be separated by semicolons, commas, or just inferred without any separators
      if (ch_i === SEMCOL || ch_i === COMMA) index++; // ignore separators
      else {
        // Try to gobble each expression individually
        if (node = gobbleExpression()) nodes.push(node);

        // If we weren't able to find a binary expression and are out of room, then
        // the expression passed in probably has too much
        else if (index < len) {
          if (ch_i === untilICode) break;
          err('Unexpected "' + char() + '"');
        }
      }
    }

    return nodes;
  },

  gobbleExpression = () => {
    const node = gobbleBinaryExpression();
    skip(isSpace);
    return node;
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
   * @returns {?jsep.BinaryExpression}
   */
  gobbleBinaryExpression = () => {
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
    if (isDecimalDigit(cc) || cc === PERIOD) return gobbleNumericLiteral();

    if (!isNotQuote(cc)) node=new String(expr.slice(++index, skip(isNotQuote))), index++ // string literal
    else if (cc === OBRACK) index++, node = [Array, ...gobbleArguments(CBRACK)] // array
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

      if (isIdentifierStart(cc)) node = gobbleIdentifier(); // LITERAL, TODO: map literal after
      else if (cc === OPAREN) node = gobbleGroup(); // open parenthesis
    }

    if (!node) return

    node = gobbleTokenProperty(node);
    return node;
  },

// FIXME: this must be part of precedence sort
  gobbleTokenProperty = (node) => {
    skip(isSpace);

    let ch = code();
    while (ch === PERIOD || ch === OBRACK || ch === OPAREN || ch === QUMARK) {
      let optional;
      // if (ch === QUMARK) {
      //   if (expr.charCodeAt(index + 1) !== PERIOD) break;
      //   optional = true;
      //   index += 2;
      //   skip(isSpace);
      //   ch = code();
      // }
      index++;

      if (ch === OBRACK) {
        node = ['.', node, gobbleExpression()] // MEMBER_EXP
        skip(isSpace);
        ch = code();
        if (ch !== CBRACK) err('Unclosed [');
        index++;
      }
      // A function call is being made; gobble all the arguments
      else if (ch === OPAREN) node = [node, ...gobbleArguments(CPAREN)] // CALL_EXP
      else if (ch === PERIOD || optional) {
        if (optional) index--;

        skip(isSpace);
        node = ['.', node, gobbleIdentifier()] // MEMBER_EXP
      }

      if (optional) node.optional = true;
      // else leave undefined for compatibility with esprima

      skip(isSpace);
      ch = code();
    }

    return node;
  },

  /**
   * Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
   * keep track of everything in the numeric literal and then calling `parseFloat` on that string
   * @returns {jsep.Literal}
   */
  gobbleNumericLiteral = () => {
    let number = '', ch, chCode;

    number += expr.slice(index, skip(isDecimalDigit))
    // while (isDecimalDigit(code())) number += expr.charAt(index++);

    if (code() === PERIOD) { // can start with a decimal marker
      number += expr.charAt(index++);
      number += expr.slice(index, skip(isDecimalDigit))
    }

    ch = char();

    if (ch === 'e' || ch === 'E') { // exponent marker
      number += expr.charAt(index++);
      ch = char();
      if (ch === '+' || ch === '-') number += expr.charAt(index++); // exponent sign
      number += expr.slice(index, skip(isDecimalDigit))
      if (!isDecimalDigit(expr.charCodeAt(index - 1)) ) err('Expected exponent (' + number + char() + ')');
    }

    chCode = code();

    // Check to make sure this isn't a variable name that start with a number (123abc)
    if (isIdentifierStart(chCode)) err('Variable names cannot start with a number (' + number + char() + ')');
    else if (chCode === PERIOD || (number.length === 1 && number.charCodeAt(0) === PERIOD)) err('Unexpected period');

    return new Number(parseFloat(number)) //  LITERAL
  },

  /**
   * Gobbles only identifiers
   * e.g.: `foo`, `_value`, `$x1`
   * Also, this function checks if that identifier is a literal:
   * (e.g. `true`, `false`, `null`) or `this`
   * @returns {jsep.Identifier}
   */
  gobbleIdentifier = () => {
    let ch = code(), start = index;
    if (isIdentifierStart(ch)) index++; else err('Unexpected ' + char());
    return expr.slice(start, skip(isIdentifierPart)) // IDENTIFIER
  },

  /**
   * Gobbles a list of arguments within the context of a function call
   * or array literal. This function also assumes that the opening character
   * `(` or `[` has already been gobbled, and gobbles expressions and commas
   * until the terminator character `)` or `]` is encountered.
   * e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
   * @param {number} termination
   * @returns {jsep.Expression[]}
   */
  gobbleArguments = (end) => {
    const args = [];
    let closed = false;
    let separator_count = 0;

    while (index < len) {
      skip(isSpace);
      let ch_i = code();

      if (ch_i === end) { // done parsing
        closed = true, index++;

        if (end === CPAREN && separator_count && separator_count >= args.length)
          err('Unexpected token ' + String.fromCharCode(end))
        break;
      }
      else if (ch_i === COMMA) { // between expressions
        index++, separator_count++;

        // missing argument
        if (separator_count !== args.length) for (let arg = args.length; arg < separator_count; arg++) args.push(null);
      }
      // NOTE: `&& separator_count !== 0` allows for either all commas, or all spaces as arguments
      else if (args.length !== separator_count && separator_count !== 0) err('Expected comma');
      else {
        const node = gobbleExpression();
        if (!node) err('Expected comma');
        args.push(node);
      }
    }

    if (!closed) err('Expected ' + String.fromCharCode(end));

    return args;
  },

  /**
   * Responsible for parsing a group of things within parentheses `()`
   * that have no identifier in front (so not a function call)
   * This function assumes that it needs to gobble the opening parenthesis
   * and then tries to gobble everything within that parenthesis, assuming
   * that the next thing it should see is the close parenthesis. If not,
   * then the expression probably doesn't have a `)`
   * @returns {boolean|jsep.Expression}
   */
  gobbleGroup = () => {
    index++;
    let nodes = gobbleExpressions(CPAREN);
    if (code() !== CPAREN) err('Unclosed (');
    index++;
    return nodes.length < 2 ? nodes[0] : nodes
  }

  // do parse
  const nodes = gobbleExpressions();

  // If there's only one expression just try returning the expression
  return nodes.length === 1 ? nodes[0] : nodes;
}

