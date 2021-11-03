const MAX_ULEN = 3, MAX_BLEN = 3,
  isDecimalDigit = (ch) => (ch >= 48 && ch <= 57), // 0...9,
  binaryPrecedence = (op_val) => binary[op_val] || 0,
  isIdentifierStart = (ch) => (ch >= 65 && ch <= 90) || // A...Z
      (ch >= 97 && ch <= 122) || // a...z
      (ch >= 128 && !binary[String.fromCharCode(ch)]) || // any non-ASCII that is not an operator
      (ch==='36'||ch==95) // $, _
  ,
  isIdentifierPart = (ch) => isIdentifierStart(ch) || isDecimalDigit(ch),
  err = message => {
    const error = new Error(message + ' at character ' + this.index);
    error.index = this.index;
    error.description = message;
    throw error;
  };

// Node Types
// This is the full set of types that any JSEP node can be.
// Store them here to save space when minified
const COMPOUND=        'Compound',
      SEQUENCE_EXP=    'SequenceExpression',
      IDENTIFIER=      'Identifier',
      MEMBER_EXP=      'MemberExpression',
      LITERAL=         'Literal',
      THIS_EXP=        'ThisExpression',
      CALL_EXP=        'CallExpression',
      UNARY_EXP=       'UnaryExpression',
      BINARY_EXP=      'BinaryExpression',
      ARRAY_EXP=       'ArrayExpression',

      TAB_CODE=    9,
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

// Operations
const unary= {
  '-': 1,
  '!': 1,
  '~': 1,
  '+': 1
},

// Also use a map for the binary operations but set their values to their
// binary precedence for quick reference (higher number = higher precedence)
// see [Order of operations](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence)
binary= {
  '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5,
  '==': 6, '!=': 6, '===': 6, '!==': 6,
  '<': 7, '>': 7, '<=': 7, '>=': 7,
  '<<': 8, '>>': 8, '>>>': 8,
  '+': 9, '-': 9,
  '*': 10, '/': 10, '%': 10
},

// Literals
literals= {
  'true': true,
  'false': false,
  'null': null
}


class Jsep {
  get char() {
    return this.expr.charAt(this.index);
  }

  get code() {
    return this.expr.charCodeAt(this.index);
  };

  constructor(expr) {
    this.expr = expr;
    this.index = 0;
  }

  /**
   * Push `index` up to the next non-space character
   */
  gobbleSpaces() {
    let ch = this.code;
    // Whitespace
    while (ch === SPACE_CODE
    || ch === TAB_CODE
    || ch === LF_CODE
    || ch === CR_CODE) {
      ch = this.expr.charCodeAt(++this.index);
    }
  }

  /**
   * Top-level method to parse all expressions and returns compound or single node
   * @returns {jsep.Expression}
   */
  parse() {
    const nodes = this.gobbleExpressions();

    // If there's only one expression just try returning the expression
    const node = nodes.length === 1
      ? nodes[0]
      : {
        type: COMPOUND,
        body: nodes
      };
    return node;
  }

  /**
   * top-level parser (but can be reused within as well)
   * @param {number} [untilICode]
   * @returns {jsep.Expression[]}
   */
  gobbleExpressions(untilICode) {
    let nodes = [], ch_i, node;

    while (this.index < this.expr.length) {
      ch_i = this.code;

      // Expressions can be separated by semicolons, commas, or just inferred without any
      // separators
      if (ch_i === SEMCOL_CODE || ch_i === COMMA_CODE) {
        this.index++; // ignore separators
      }
      else {
        // Try to gobble each expression individually
        if (node = this.gobbleExpression()) {
          nodes.push(node);
          // If we weren't able to find a binary expression and are out of room, then
          // the expression passed in probably has too much
        }
        else if (this.index < this.expr.length) {
          if (ch_i === untilICode) {
            break;
          }
          err('Unexpected "' + this.char + '"');
        }
      }
    }

    return nodes;
  }

  /**
   * The main parsing function.
   * @returns {?jsep.Expression}
   */
  gobbleExpression() {
    const node = this.gobbleBinaryExpression();
    this.gobbleSpaces();

    return node;
  }

  /**
   * Search for the operation portion of the string (e.g. `+`, `===`)
   * Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
   * and move down from 3 to 2 to 1 character until a matching binary operation is found
   * then, return that binary operation
   * @returns {string|boolean}
   */
  gobbleBinaryOp() {
    this.gobbleSpaces();
    let to_check = this.expr.substr(this.index, MAX_BLEN);
    let tc_len = to_check.length;

    while (tc_len > 0) {
      // Don't accept a binary op when it is an identifier.
      // Binary ops that start with a identifier-valid character must be followed
      // by a non identifier-part valid character
      if (binary.hasOwnProperty(to_check) && (
        !isIdentifierStart(this.code) ||
        (this.index + to_check.length < this.expr.length && !isIdentifierPart(this.expr.charCodeAt(this.index + to_check.length)))
      )) {
        this.index += tc_len;
        return to_check;
      }
      to_check = to_check.substr(0, --tc_len);
    }
    return false;
  }

  /**
   * This function is responsible for gobbling an individual expression,
   * e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
   * @returns {?jsep.BinaryExpression}
   */
  gobbleBinaryExpression() {
    let node, biop, prec, stack, biop_info, left, right, i, cur_biop;

    // First, try to get the leftmost thing
    // Then, check to see if there's a binary operator operating on that leftmost thing
    // Don't gobbleBinaryOp without a left-hand-side
    left = this.gobbleToken();
    if (!left) {
      return left;
    }
    biop = this.gobbleBinaryOp();

    // If there wasn't a binary operator, just return the leftmost node
    if (!biop) {
      return left;
    }

    // Otherwise, we need to start a stack to properly place the binary operations in their
    // precedence structure
    biop_info = { value: biop, prec: binaryPrecedence(biop) };

    right = this.gobbleToken();

    if (!right) {
      err("Expected expression after " + biop);
    }

    stack = [left, biop_info, right];

    // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
    while ((biop = this.gobbleBinaryOp())) {
      prec = binaryPrecedence(biop);

      if (prec === 0) {
        this.index -= biop.length;
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
        node = {
          type: BINARY_EXP,
          operator: biop,
          left,
          right
        };
        stack.push(node);
      }

      node = this.gobbleToken();

      if (!node) {
        err("Expected expression after " + cur_biop);
      }

      stack.push(biop_info, node);
    }

    i = stack.length - 1;
    node = stack[i];

    while (i > 1) {
      node = {
        type: BINARY_EXP,
        operator: stack[i - 1].value,
        left: stack[i - 2],
        right: node
      };
      i -= 2;
    }

    return node;
  }

  /**
   * An individual part of a binary expression:
   * e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
   * @returns {boolean|jsep.Expression}
   */
  gobbleToken() {
    let ch, to_check, tc_len, node;

    this.gobbleSpaces();

    ch = this.code;

    if (isDecimalDigit(ch) || ch === PERIOD_CODE) {
      // Char code 46 is a dot `.` which can start off a numeric literal
      return this.gobbleNumericLiteral();
    }

    if (ch === SQUOTE_CODE || ch === DQUOTE_CODE) {
      // Single or double quotes
      node = this.gobbleStringLiteral();
    }
    else if (ch === OBRACK_CODE) {
      node = this.gobbleArray();
    }
    else {
      to_check = this.expr.substr(this.index, MAX_ULEN);
      tc_len = to_check.length;

      while (tc_len > 0) {
        // Don't accept an unary op when it is an identifier.
        // Unary ops that start with a identifier-valid character must be followed
        // by a non identifier-part valid character
        if (unary.hasOwnProperty(to_check) && (
          !isIdentifierStart(this.code) ||
          (this.index + to_check.length < this.expr.length && !isIdentifierPart(this.expr.charCodeAt(this.index + to_check.length)))
        )) {
          this.index += tc_len;
          const argument = this.gobbleToken();
          if (!argument) {
            err('missing unaryOp argument');
          }
          return {
            type: UNARY_EXP,
            operator: to_check,
            argument,
            prefix: true
          };
        }

        to_check = to_check.substr(0, --tc_len);
      }

      if (isIdentifierStart(ch)) {
        node = this.gobbleIdentifier();
        if (literals.hasOwnProperty(node.name)) {
          node = {
            type: LITERAL,
            value: literals[node.name],
            raw: node.name,
          };
        }
      }
      else if (ch === OPAREN_CODE) { // open parenthesis
        node = this.gobbleGroup();
      }
    }

    if (!node) return false

    node = this.gobbleTokenProperty(node);
    return node;
  }

  /**
   * Gobble properties of of identifiers/strings/arrays/groups.
   * e.g. `foo`, `bar.baz`, `foo['bar'].baz`
   * It also gobbles function calls:
   * e.g. `Math.acos(obj.angle)`
   * @param {jsep.Expression} node
   * @returns {jsep.Expression}
   */
  gobbleTokenProperty(node) {
    this.gobbleSpaces();

    let ch = this.code;
    while (ch === PERIOD_CODE || ch === OBRACK_CODE || ch === OPAREN_CODE || ch === QUMARK_CODE) {
      let optional;
      if (ch === QUMARK_CODE) {
        if (this.expr.charCodeAt(this.index + 1) !== PERIOD_CODE) {
          break;
        }
        optional = true;
        this.index += 2;
        this.gobbleSpaces();
        ch = this.code;
      }
      this.index++;

      if (ch === OBRACK_CODE) {
        node = {
          type: MEMBER_EXP,
          computed: true,
          object: node,
          property: this.gobbleExpression()
        };
        this.gobbleSpaces();
        ch = this.code;
        if (ch !== CBRACK_CODE) {
          err('Unclosed [');
        }
        this.index++;
      }
      else if (ch === OPAREN_CODE) {
        // A function call is being made; gobble all the arguments
        node = {
          type: CALL_EXP,
          'arguments': this.gobbleArguments(CPAREN_CODE),
          callee: node
        };
      }
      else if (ch === PERIOD_CODE || optional) {
        if (optional) {
          this.index--;
        }
        this.gobbleSpaces();
        node = {
          type: MEMBER_EXP,
          computed: false,
          object: node,
          property: this.gobbleIdentifier(),
        };
      }

      if (optional) {
        node.optional = true;
      } // else leave undefined for compatibility with esprima

      this.gobbleSpaces();
      ch = this.code;
    }

    return node;
  }

  /**
   * Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
   * keep track of everything in the numeric literal and then calling `parseFloat` on that string
   * @returns {jsep.Literal}
   */
  gobbleNumericLiteral() {
    let number = '', ch, chCode;

    while (isDecimalDigit(this.code)) {
      number += this.expr.charAt(this.index++);
    }

    if (this.code === PERIOD_CODE) { // can start with a decimal marker
      number += this.expr.charAt(this.index++);

      while (isDecimalDigit(this.code)) {
        number += this.expr.charAt(this.index++);
      }
    }

    ch = this.char;

    if (ch === 'e' || ch === 'E') { // exponent marker
      number += this.expr.charAt(this.index++);
      ch = this.char;

      if (ch === '+' || ch === '-') { // exponent sign
        number += this.expr.charAt(this.index++);
      }

      while (isDecimalDigit(this.code)) { // exponent itself
        number += this.expr.charAt(this.index++);
      }

      if (!isDecimalDigit(this.expr.charCodeAt(this.index - 1)) ) {
        err('Expected exponent (' + number + this.char + ')');
      }
    }

    chCode = this.code;

    // Check to make sure this isn't a variable name that start with a number (123abc)
    if (isIdentifierStart(chCode)) {
      err('Variable names cannot start with a number (' +
        number + this.char + ')');
    }
    else if (chCode === PERIOD_CODE || (number.length === 1 && number.charCodeAt(0) === PERIOD_CODE)) {
      err('Unexpected period');
    }

    return {
      type: LITERAL,
      value: parseFloat(number),
      raw: number
    };
  }

  /**
   * Parses a string literal, staring with single or double quotes with basic support for escape codes
   * e.g. `"hello world"`, `'this is\nJSEP'`
   * @returns {jsep.Literal}
   */
  gobbleStringLiteral() {
    let str = '';
    const startIndex = this.index;
    const quote = this.expr.charAt(this.index++);
    let closed = false;

    while (this.index < this.expr.length) {
      let ch = this.expr.charAt(this.index++);

      if (ch === quote) {
        closed = true;
        break;
      }
      else if (ch === '\\') {
        // Check for all of the common escape codes
        ch = this.expr.charAt(this.index++);

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

    return {
      type: LITERAL,
      value: str,
      raw: this.expr.substring(startIndex, this.index),
    };
  }

  /**
   * Gobbles only identifiers
   * e.g.: `foo`, `_value`, `$x1`
   * Also, this function checks if that identifier is a literal:
   * (e.g. `true`, `false`, `null`) or `this`
   * @returns {jsep.Identifier}
   */
  gobbleIdentifier() {
    let ch = this.code, start = this.index;

    if (isIdentifierStart(ch)) {
      this.index++;
    }
    else {
      err('Unexpected ' + this.char);
    }

    while (this.index < this.expr.length) {
      ch = this.code;

      if (isIdentifierPart(ch)) {
        this.index++;
      }
      else {
        break;
      }
    }
    return {
      type: IDENTIFIER,
      name: this.expr.slice(start, this.index),
    };
  }

  /**
   * Gobbles a list of arguments within the context of a function call
   * or array literal. This function also assumes that the opening character
   * `(` or `[` has already been gobbled, and gobbles expressions and commas
   * until the terminator character `)` or `]` is encountered.
   * e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
   * @param {number} termination
   * @returns {jsep.Expression[]}
   */
  gobbleArguments(termination) {
    const args = [];
    let closed = false;
    let separator_count = 0;

    while (this.index < this.expr.length) {
      this.gobbleSpaces();
      let ch_i = this.code;

      if (ch_i === termination) { // done parsing
        closed = true;
        this.index++;

        if (termination === CPAREN_CODE && separator_count && separator_count >= args.length){
          err('Unexpected token ' + String.fromCharCode(termination));
        }

        break;
      }
      else if (ch_i === COMMA_CODE) { // between expressions
        this.index++;
        separator_count++;

        if (separator_count !== args.length) { // missing argument
          if (termination === CPAREN_CODE) {
            err('Unexpected token ,');
          }
          else if (termination === CBRACK_CODE) {
            for (let arg = args.length; arg < separator_count; arg++) {
              args.push(null);
            }
          }
        }
      }
      else if (args.length !== separator_count && separator_count !== 0) {
        // NOTE: `&& separator_count !== 0` allows for either all commas, or all spaces as arguments
        err('Expected comma');
      }
      else {
        const node = this.gobbleExpression();

        if (!node || node.type === COMPOUND) {
          err('Expected comma');
        }

        args.push(node);
      }
    }

    if (!closed) {
      err('Expected ' + String.fromCharCode(termination));
    }

    return args;
  }

  /**
   * Responsible for parsing a group of things within parentheses `()`
   * that have no identifier in front (so not a function call)
   * This function assumes that it needs to gobble the opening parenthesis
   * and then tries to gobble everything within that parenthesis, assuming
   * that the next thing it should see is the close parenthesis. If not,
   * then the expression probably doesn't have a `)`
   * @returns {boolean|jsep.Expression}
   */
  gobbleGroup() {
    this.index++;
    let nodes = this.gobbleExpressions(CPAREN_CODE);
    if (this.code === CPAREN_CODE) {
      this.index++;
      if (nodes.length === 1) {
        return nodes[0];
      }
      else if (!nodes.length) {
        return false;
      }
      else {
        return {
          type: SEQUENCE_EXP,
          expressions: nodes,
        };
      }
    }
    else err('Unclosed (');
  }

  /**
   * Responsible for parsing Array literals `[1, 2, 3]`
   * This function assumes that it needs to gobble the opening bracket
   * and then tries to gobble the expressions as arguments.
   * @returns {jsep.ArrayExpression}
   */
  gobbleArray() {
    this.index++;

    return {
      type: ARRAY_EXP,
      elements: this.gobbleArguments(CBRACK_CODE)
    };
  }
}

export default (expr) => {
  return (new Jsep(expr)).parse();
}
