const MAX_ULEN = 3, MAX_BLEN = 3,
  isDecimalDigit = (ch) => (ch >= 48 && ch <= 57), // 0...9,
  binaryPrecedence = (op_val) => binary[op_val] || 0,
  isIdentifierStart = (ch) => (ch >= 65 && ch <= 90) || // A...Z
      (ch >= 97 && ch <= 122) || // a...z
      (ch >= 128 && !binary[String.fromCharCode(ch)]) || // any non-ASCII that is not an operator
      (ch==='36'||ch==95) // $, _
  ,
  isIdentifierPart = (ch) => isIdentifierStart(ch) || isDecimalDigit(ch)

const TAB_CODE=    9,
      LF_CODE=     10,
      CR_CODE=     13,
      SPACE_CODE=  32,
      PERIOD_CODE= 46, // '.'
      COMMA_CODE=  44, // ','
      SQUOTE_CODE= 39, // single quote
      DQUOTE_CODE= 34, // double quotes
      OPAREN_CODE= 40, // (
      CPAREN_CODE= 41, // )
      OBRACK_CODE= 91, // [
      CBRACK_CODE= 93, // ]
      QUMARK_CODE= 63, // ?
      SEMCOL_CODE= 59, // ;
      COLON_CODE=  58 // :

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

export default (expr, index=0) => {
  const char = () => expr.charAt(index),
  err = (message) => {
    const error = new Error(message + ' at character ' + index);
    error.index = index;
    error.description = message;
    throw error;
  },
  code = () => expr.charCodeAt(index),

  /**
   * Push `index` up to the next non-space character
   */
  gobbleSpaces = () => {
    let ch = code();
    // Whitespace
    while (ch === SPACE_CODE
    || ch === TAB_CODE
    || ch === LF_CODE
    || ch === CR_CODE) ch = expr.charCodeAt(++index)
  },

  /**
   * top-level parser (but can be reused within as well)
   * @param {number} [untilICode]
   * @returns {jsep.Expression[]}
   */
  gobbleExpressions = (untilICode) => {
    let nodes = [], ch_i, node;

    while (index < expr.length) {
      ch_i = code();

      // Expressions can be separated by semicolons, commas, or just inferred without any
      // separators
      if (ch_i === SEMCOL_CODE || ch_i === COMMA_CODE) {
        index++; // ignore separators
      }
      else {
        // Try to gobble each expression individually
        if (node = gobbleExpression()) {
          nodes.push(node);
          // If we weren't able to find a binary expression and are out of room, then
          // the expression passed in probably has too much
        }
        else if (index < expr.length) {
          if (ch_i === untilICode) {
            break;
          }
          err('Unexpected "' + char() + '"');
        }
      }
    }

    return nodes;
  },

  /**
   * The main parsing function.
   * @returns {?jsep.Expression}
   */
  gobbleExpression = () => {
    const node = gobbleBinaryExpression();
    gobbleSpaces();

    return node;
  },

  /**
   * Search for the operation portion of the string (e.g. `+`, `===`)
   * Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
   * and move down from 3 to 2 to 1 character until a matching binary operation is found
   * then, return that binary operation
   * @returns {string|boolean}
   */
  gobbleBinaryOp = () => {
    gobbleSpaces();
    let to_check = expr.substr(index, MAX_BLEN);
    let tc_len = to_check.length;

    while (tc_len > 0) {
      // Don't accept a binary op when it is an identifier.
      // Binary ops that start with a identifier-valid character must be followed
      // by a non identifier-part valid character
      if (binary.hasOwnProperty(to_check) && (
        !isIdentifierStart(code()) ||
        (index + to_check.length < expr.length && !isIdentifierPart(expr.charCodeAt(index + to_check.length)))
      )) {
        index += tc_len;
        return to_check;
      }
      to_check = to_check.substr(0, --tc_len);
    }
    return false;
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
    left = gobbleToken();
    if (!left) return left;

    biop = gobbleBinaryOp();

    // If there wasn't a binary operator, just return the leftmost node
    if (!biop) return left;

    // Otherwise, we need to start a stack to properly place the binary operations in their
    // precedence structure
    biop_info = { value: biop, prec: binaryPrecedence(biop) };

    right = gobbleToken();

    if (!right) err("Expected expression after " + biop);

    stack = [left, biop_info, right];

    // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
    while ((biop = gobbleBinaryOp())) {
      prec = binaryPrecedence(biop);

      if (prec === 0) {
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
    let ch, to_check, tc_len, node;

    gobbleSpaces();

    ch = code();

    // Char code 46 is a dot `.` which can start off a numeric literal
    if (isDecimalDigit(ch) || ch === PERIOD_CODE) return gobbleNumericLiteral();

    // Single or double quotes
    if (ch === SQUOTE_CODE || ch === DQUOTE_CODE) node = gobbleStringLiteral();
    else if (ch === OBRACK_CODE) node = gobbleArray();
    else {
      to_check = expr.substr(index, MAX_ULEN);
      tc_len = to_check.length;

      while (tc_len > 0) {
        // Don't accept an unary op when it is an identifier.
        // Unary ops that start with a identifier-valid character must be followed
        // by a non identifier-part valid character
        if (unary.hasOwnProperty(to_check) && (
          !isIdentifierStart(code()) ||
          (index + to_check.length < expr.length && !isIdentifierPart(expr.charCodeAt(index + to_check.length)))
        )) {
          index += tc_len;
          const argument = gobbleToken();
          if (!argument) {
            err('missing unaryOp argument');
          }
          return [to_check, argument] // UNARY_EXP
        }

        to_check = to_check.substr(0, --tc_len);
      }

      if (isIdentifierStart(ch)) {
        node = gobbleIdentifier();
        if (literals.hasOwnProperty(node.name)) {
          node = node.name // LITERAL, TODO: map literal after
        }
      }
      // open parenthesis
      else if (ch === OPAREN_CODE) node = gobbleGroup();
    }

    if (!node) return false

    node = gobbleTokenProperty(node);
    return node;
  },

  /**
   * Gobble properties of of identifiers/strings/arrays/groups.
   * e.g. `foo`, `bar.baz`, `foo['bar'].baz`
   * It also gobbles function calls:
   * e.g. `Math.acos(obj.angle)`
   * @param {jsep.Expression} node
   * @returns {jsep.Expression}
   */
  gobbleTokenProperty = (node) => {
    gobbleSpaces();

    let ch = code();
    while (ch === PERIOD_CODE || ch === OBRACK_CODE || ch === OPAREN_CODE || ch === QUMARK_CODE) {
      let optional;
      if (ch === QUMARK_CODE) {
        if (expr.charCodeAt(index + 1) !== PERIOD_CODE) {
          break;
        }
        optional = true;
        index += 2;
        gobbleSpaces();
        ch = code();
      }
      index++;

      if (ch === OBRACK_CODE) {
        node = ['.', node, gobbleExpression()] // MEMBER_EXP
        gobbleSpaces();
        ch = code();
        if (ch !== CBRACK_CODE) {
          err('Unclosed [');
        }
        index++;
      }
      else if (ch === OPAREN_CODE) {
        // A function call is being made; gobble all the arguments
        node = [node, gobbleArguments(CPAREN_CODE)] // CALL_EXP
      }
      else if (ch === PERIOD_CODE || optional) {
        if (optional) index--;

        gobbleSpaces();
        node = ['.', node, gobbleIdentifier()] // MEMBER_EXP
      }

      if (optional) node.optional = true;
      // else leave undefined for compatibility with esprima

      gobbleSpaces();
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

    while (isDecimalDigit(code())) {
      number += expr.charAt(index++);
    }

    if (code() === PERIOD_CODE) { // can start with a decimal marker
      number += expr.charAt(index++);

      while (isDecimalDigit(code())) {
        number += expr.charAt(index++);
      }
    }

    ch = char();

    if (ch === 'e' || ch === 'E') { // exponent marker
      number += expr.charAt(index++);
      ch = char();

      if (ch === '+' || ch === '-') { // exponent sign
        number += expr.charAt(index++);
      }

      while (isDecimalDigit(code())) { // exponent itself
        number += expr.charAt(index++);
      }

      if (!isDecimalDigit(expr.charCodeAt(index - 1)) ) {
        err('Expected exponent (' + number + char() + ')');
      }
    }

    chCode = code();

    // Check to make sure this isn't a variable name that start with a number (123abc)
    if (isIdentifierStart(chCode)) err('Variable names cannot start with a number (' + number + char() + ')');
    else if (chCode === PERIOD_CODE || (number.length === 1 && number.charCodeAt(0) === PERIOD_CODE)) err('Unexpected period');

    return parseFloat(number) //  LITERAL
  },

  /**
   * Parses a string literal, staring with single or double quotes with basic support for escape codes
   * e.g. `"hello world"`, `'this is\nJSEP'`
   * @returns {jsep.Literal}
   */
  gobbleStringLiteral = () => {
    let str = '';
    const startIndex = index;
    const quote = expr.charAt(index++);
    let closed = false;

    while (index < expr.length) {
      let ch = expr.charAt(index++);

      if (ch === quote) {
        closed = true;
        break;
      }
      else if (ch === '\\') {
        // Check for all of the common escape codes
        ch = expr.charAt(index++);

        switch (ch) {
          case 'n': str += '\n'; break;
          case 'r': str += '\r'; break;
          case 't': str += '\t'; break;
          case 'b': str += '\b'; break;
          case 'f': str += '\f'; break;
          case 'v': str += '\x0B'; break;
          default : str += ch;
        }
      }
      else {
        str += ch;
      }
    }

    if (!closed) {
      err('Unclosed quote after "' + str + '"');
    }

    return str // LITERAL
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

    if (isIdentifierStart(ch)) index++;
    else err('Unexpected ' + char());

    while (index < expr.length) {
      ch = code();

      if (isIdentifierPart(ch)) index++;
      else break;
    }
    return expr.slice(start, index) // IDENTIFIER
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
  gobbleArguments = (termination) => {
    const args = [];
    let closed = false;
    let separator_count = 0;

    while (index < expr.length) {
      gobbleSpaces();
      let ch_i = code();

      if (ch_i === termination) { // done parsing
        closed = true;
        index++;

        if (termination === CPAREN_CODE && separator_count && separator_count >= args.length){
          err('Unexpected token ' + String.fromCharCode(termination));
        }

        break;
      }
      else if (ch_i === COMMA_CODE) { // between expressions
        index++;
        separator_count++;

        if (separator_count !== args.length) { // missing argument
          if (termination === CPAREN_CODE) err('Unexpected token ,');
          else if (termination === CBRACK_CODE) {
            for (let arg = args.length; arg < separator_count; arg++) {
              args.push(null);
            }
          }
        }
      }
      // NOTE: `&& separator_count !== 0` allows for either all commas, or all spaces as arguments
      else if (args.length !== separator_count && separator_count !== 0) err('Expected comma');
      else {
        const node = gobbleExpression();

        if (!node) err('Expected comma');

        args.push(node);
      }
    }

    if (!closed) err('Expected ' + String.fromCharCode(termination));

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
    let nodes = gobbleExpressions(CPAREN_CODE);
    if (code() === CPAREN_CODE) {
      index++;
      if (nodes.length === 1) return nodes[0];
      else if (!nodes.length) return false;
      else return nodes // SEQUENCE_EXP
    }
    else err('Unclosed (');
  },

  /**
   * Responsible for parsing Array literals `[1, 2, 3]`
   * This function assumes that it needs to gobble the opening bracket
   * and then tries to gobble the expressions as arguments.
   * @returns {jsep.ArrayExpression}
   */
  gobbleArray = () => {
    index++;

    return [Array, ...gobbleArguments(CBRACK_CODE)] // ARRAY_EXP
  }


  // do parse
  const nodes = gobbleExpressions();

  // If there's only one expression just try returning the expression
  return nodes.length === 1 ? nodes[0] : nodes;
}

