const MAX_ULEN = 3, MAX_BLEN = 3

class Jsep {
  static addIdentifierChar(char) {
    Jsep.additional_identifier_chars.add(char);
    return Jsep;
  }

  static removeIdentifierChar(char) {
    Jsep.additional_identifier_chars.delete(char);
    return Jsep;
  }


  get char() {
    return this.expr.charAt(this.index);
  }

  get code() {
    return this.expr.charCodeAt(this.index);
  };

  constructor(expr) {
    // `index` stores the character number we are currently at
    // All of the gobbles below will modify `index` as we move along
    this.expr = expr;
    this.index = 0;
  }
  static getMaxKeyLen(obj) {
    return Math.max(0, ...Object.keys(obj).map(k => k.length));
  }
  static isDecimalDigit(ch) {
    return (ch >= 48 && ch <= 57); // 0...9
  }
  static binaryPrecedence(op_val) {
    return Jsep.binary_ops[op_val] || 0;
  }
  static isIdentifierStart(ch) {
    return  (ch >= 65 && ch <= 90) || // A...Z
      (ch >= 97 && ch <= 122) || // a...z
      (ch >= 128 && !Jsep.binary_ops[String.fromCharCode(ch)]) || // any non-ASCII that is not an operator
      (Jsep.additional_identifier_chars.has(String.fromCharCode(ch))); // additional characters
  }
  static isIdentifierPart(ch) {
    return Jsep.isIdentifierStart(ch) || Jsep.isDecimalDigit(ch);
  }
  throwError(message) {
    const error = new Error(message + ' at character ' + this.index);
    error.index = this.index;
    error.description = message;
    throw error;
  }


  /**
   * Push `index` up to the next non-space character
   */
  gobbleSpaces() {
    let ch = this.code;
    // Whitespace
    while (ch === Jsep.SPACE_CODE
    || ch === Jsep.TAB_CODE
    || ch === Jsep.LF_CODE
    || ch === Jsep.CR_CODE) {
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
        type: Jsep.COMPOUND,
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
      if (ch_i === Jsep.SEMCOL_CODE || ch_i === Jsep.COMMA_CODE) {
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
          this.throwError('Unexpected "' + this.char + '"');
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
      if (Jsep.binary_ops.hasOwnProperty(to_check) && (
        !Jsep.isIdentifierStart(this.code) ||
        (this.index + to_check.length < this.expr.length && !Jsep.isIdentifierPart(this.expr.charCodeAt(this.index + to_check.length)))
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
    biop_info = { value: biop, prec: Jsep.binaryPrecedence(biop), right_a: Jsep.right_associative.has(biop) };

    right = this.gobbleToken();

    if (!right) {
      this.throwError("Expected expression after " + biop);
    }

    stack = [left, biop_info, right];

    // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
    while ((biop = this.gobbleBinaryOp())) {
      prec = Jsep.binaryPrecedence(biop);

      if (prec === 0) {
        this.index -= biop.length;
        break;
      }

      biop_info = { value: biop, prec, right_a: Jsep.right_associative.has(biop) };

      cur_biop = biop;

      // Reduce: make a binary expression from the three topmost entries.
      const comparePrev = prev => biop_info.right_a && prev.right_a
        ? prec > prev.prec
        : prec <= prev.prec;
      while ((stack.length > 2) && comparePrev(stack[stack.length - 2])) {
        right = stack.pop();
        biop = stack.pop().value;
        left = stack.pop();
        node = {
          type: Jsep.BINARY_EXP,
          operator: biop,
          left,
          right
        };
        stack.push(node);
      }

      node = this.gobbleToken();

      if (!node) {
        this.throwError("Expected expression after " + cur_biop);
      }

      stack.push(biop_info, node);
    }

    i = stack.length - 1;
    node = stack[i];

    while (i > 1) {
      node = {
        type: Jsep.BINARY_EXP,
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

    if (Jsep.isDecimalDigit(ch) || ch === Jsep.PERIOD_CODE) {
      // Char code 46 is a dot `.` which can start off a numeric literal
      return this.gobbleNumericLiteral();
    }

    if (ch === Jsep.SQUOTE_CODE || ch === Jsep.DQUOTE_CODE) {
      // Single or double quotes
      node = this.gobbleStringLiteral();
    }
    else if (ch === Jsep.OBRACK_CODE) {
      node = this.gobbleArray();
    }
    else {
      to_check = this.expr.substr(this.index, MAX_ULEN);
      tc_len = to_check.length;

      while (tc_len > 0) {
        // Don't accept an unary op when it is an identifier.
        // Unary ops that start with a identifier-valid character must be followed
        // by a non identifier-part valid character
        if (Jsep.unary_ops.hasOwnProperty(to_check) && (
          !Jsep.isIdentifierStart(this.code) ||
          (this.index + to_check.length < this.expr.length && !Jsep.isIdentifierPart(this.expr.charCodeAt(this.index + to_check.length)))
        )) {
          this.index += tc_len;
          const argument = this.gobbleToken();
          if (!argument) {
            this.throwError('missing unaryOp argument');
          }
          return {
            type: Jsep.UNARY_EXP,
            operator: to_check,
            argument,
            prefix: true
          };
        }

        to_check = to_check.substr(0, --tc_len);
      }

      if (Jsep.isIdentifierStart(ch)) {
        node = this.gobbleIdentifier();
        if (Jsep.literals.hasOwnProperty(node.name)) {
          node = {
            type: Jsep.LITERAL,
            value: Jsep.literals[node.name],
            raw: node.name,
          };
        }
        else if (node.name === Jsep.this_str) {
          node = { type: Jsep.THIS_EXP };
        }
      }
      else if (ch === Jsep.OPAREN_CODE) { // open parenthesis
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
    while (ch === Jsep.PERIOD_CODE || ch === Jsep.OBRACK_CODE || ch === Jsep.OPAREN_CODE || ch === Jsep.QUMARK_CODE) {
      let optional;
      if (ch === Jsep.QUMARK_CODE) {
        if (this.expr.charCodeAt(this.index + 1) !== Jsep.PERIOD_CODE) {
          break;
        }
        optional = true;
        this.index += 2;
        this.gobbleSpaces();
        ch = this.code;
      }
      this.index++;

      if (ch === Jsep.OBRACK_CODE) {
        node = {
          type: Jsep.MEMBER_EXP,
          computed: true,
          object: node,
          property: this.gobbleExpression()
        };
        this.gobbleSpaces();
        ch = this.code;
        if (ch !== Jsep.CBRACK_CODE) {
          this.throwError('Unclosed [');
        }
        this.index++;
      }
      else if (ch === Jsep.OPAREN_CODE) {
        // A function call is being made; gobble all the arguments
        node = {
          type: Jsep.CALL_EXP,
          'arguments': this.gobbleArguments(Jsep.CPAREN_CODE),
          callee: node
        };
      }
      else if (ch === Jsep.PERIOD_CODE || optional) {
        if (optional) {
          this.index--;
        }
        this.gobbleSpaces();
        node = {
          type: Jsep.MEMBER_EXP,
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

    while (Jsep.isDecimalDigit(this.code)) {
      number += this.expr.charAt(this.index++);
    }

    if (this.code === Jsep.PERIOD_CODE) { // can start with a decimal marker
      number += this.expr.charAt(this.index++);

      while (Jsep.isDecimalDigit(this.code)) {
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

      while (Jsep.isDecimalDigit(this.code)) { // exponent itself
        number += this.expr.charAt(this.index++);
      }

      if (!Jsep.isDecimalDigit(this.expr.charCodeAt(this.index - 1)) ) {
        this.throwError('Expected exponent (' + number + this.char + ')');
      }
    }

    chCode = this.code;

    // Check to make sure this isn't a variable name that start with a number (123abc)
    if (Jsep.isIdentifierStart(chCode)) {
      this.throwError('Variable names cannot start with a number (' +
        number + this.char + ')');
    }
    else if (chCode === Jsep.PERIOD_CODE || (number.length === 1 && number.charCodeAt(0) === Jsep.PERIOD_CODE)) {
      this.throwError('Unexpected period');
    }

    return {
      type: Jsep.LITERAL,
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
      this.throwError('Unclosed quote after "' + str + '"');
    }

    return {
      type: Jsep.LITERAL,
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

    if (Jsep.isIdentifierStart(ch)) {
      this.index++;
    }
    else {
      this.throwError('Unexpected ' + this.char);
    }

    while (this.index < this.expr.length) {
      ch = this.code;

      if (Jsep.isIdentifierPart(ch)) {
        this.index++;
      }
      else {
        break;
      }
    }
    return {
      type: Jsep.IDENTIFIER,
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

        if (termination === Jsep.CPAREN_CODE && separator_count && separator_count >= args.length){
          this.throwError('Unexpected token ' + String.fromCharCode(termination));
        }

        break;
      }
      else if (ch_i === Jsep.COMMA_CODE) { // between expressions
        this.index++;
        separator_count++;

        if (separator_count !== args.length) { // missing argument
          if (termination === Jsep.CPAREN_CODE) {
            this.throwError('Unexpected token ,');
          }
          else if (termination === Jsep.CBRACK_CODE) {
            for (let arg = args.length; arg < separator_count; arg++) {
              args.push(null);
            }
          }
        }
      }
      else if (args.length !== separator_count && separator_count !== 0) {
        // NOTE: `&& separator_count !== 0` allows for either all commas, or all spaces as arguments
        this.throwError('Expected comma');
      }
      else {
        const node = this.gobbleExpression();

        if (!node || node.type === Jsep.COMPOUND) {
          this.throwError('Expected comma');
        }

        args.push(node);
      }
    }

    if (!closed) {
      this.throwError('Expected ' + String.fromCharCode(termination));
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
    let nodes = this.gobbleExpressions(Jsep.CPAREN_CODE);
    if (this.code === Jsep.CPAREN_CODE) {
      this.index++;
      if (nodes.length === 1) {
        return nodes[0];
      }
      else if (!nodes.length) {
        return false;
      }
      else {
        return {
          type: Jsep.SEQUENCE_EXP,
          expressions: nodes,
        };
      }
    }
    else {
      this.throwError('Unclosed (');
    }
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
      type: Jsep.ARRAY_EXP,
      elements: this.gobbleArguments(Jsep.CBRACK_CODE)
    };
  }
}

// Static fields:
Object.assign(Jsep, {
  // Node Types
  // ----------
  // This is the full set of types that any JSEP node can be.
  // Store them here to save space when minified
  COMPOUND:        'Compound',
  SEQUENCE_EXP:    'SequenceExpression',
  IDENTIFIER:      'Identifier',
  MEMBER_EXP:      'MemberExpression',
  LITERAL:         'Literal',
  THIS_EXP:        'ThisExpression',
  CALL_EXP:        'CallExpression',
  UNARY_EXP:       'UnaryExpression',
  BINARY_EXP:      'BinaryExpression',
  ARRAY_EXP:       'ArrayExpression',

  TAB_CODE:    9,
  LF_CODE:     10,
  CR_CODE:     13,
  SPACE_CODE:  32,
  PERIOD_CODE: 46, // '.'
  COMMA_CODE:  44, // ','
  SQUOTE_CODE: 39, // single quote
  DQUOTE_CODE: 34, // double quotes
  OPAREN_CODE: 40, // (
  CPAREN_CODE: 41, // )
  OBRACK_CODE: 91, // [
  CBRACK_CODE: 93, // ]
  QUMARK_CODE: 63, // ?
  SEMCOL_CODE: 59, // ;
  COLON_CODE:  58, // :


  // Operations
  // ----------
  // Use a quickly-accessible map to store all of the unary operators
  // Values are set to `1` (it really doesn't matter)
  unary_ops: {
    '-': 1,
    '!': 1,
    '~': 1,
    '+': 1
  },

  // Also use a map for the binary operations but set their values to their
  // binary precedence for quick reference (higher number = higher precedence)
  // see [Order of operations](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence)
  binary_ops: {
    '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5,
    '==': 6, '!=': 6, '===': 6, '!==': 6,
    '<': 7, '>': 7, '<=': 7, '>=': 7,
    '<<': 8, '>>': 8, '>>>': 8,
    '+': 9, '-': 9,
    '*': 10, '/': 10, '%': 10
  },

  // sets specific binary_ops as right-associative
  right_associative: new Set(),

  // Additional valid identifier chars, apart from a-z, A-Z and 0-9 (except on the starting char)
  additional_identifier_chars: new Set(['$', '_']),

  // Literals
  // ----------
  // Store the values to return for the various literals we may encounter
  literals: {
    'true': true,
    'false': false,
    'null': null
  },

  // Except for `this`, which is special. This could be changed to something like `'self'` as well
  this_str: 'this',
});

export default (expr) => {
  return (new Jsep(expr)).parse();
}
