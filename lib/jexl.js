function createCommonjsModule(fn, basedir, module) {
  return module = {
    path: basedir,
    exports: {},
    require: function(path, base) {
      return commonjsRequire(path, base === void 0 || base === null ? module.path : base);
    }
  }, fn(module, module.exports), module.exports;
}
function commonjsRequire() {
  throw new Error("Dynamic requires are not currently supported by @rollup/plugin-commonjs");
}
var interopRequireDefault = createCommonjsModule(function(module) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }
  module.exports = _interopRequireDefault;
});
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
var defineProperty = _defineProperty;
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
var classCallCheck = _classCallCheck;
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor)
      descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps)
    _defineProperties(Constructor.prototype, protoProps);
  if (staticProps)
    _defineProperties(Constructor, staticProps);
  return Constructor;
}
var createClass = _createClass;
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }
  return arr2;
}
var arrayLikeToArray = _arrayLikeToArray;
function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr))
    return arrayLikeToArray(arr);
}
var arrayWithoutHoles = _arrayWithoutHoles;
function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter))
    return Array.from(iter);
}
var iterableToArray = _iterableToArray;
function _unsupportedIterableToArray(o, minLen) {
  if (!o)
    return;
  if (typeof o === "string")
    return arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor)
    n = o.constructor.name;
  if (n === "Map" || n === "Set")
    return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return arrayLikeToArray(o, minLen);
}
var unsupportedIterableToArray = _unsupportedIterableToArray;
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
var nonIterableSpread = _nonIterableSpread;
function _toConsumableArray(arr) {
  return arrayWithoutHoles(arr) || iterableToArray(arr) || unsupportedIterableToArray(arr) || nonIterableSpread();
}
var toConsumableArray = _toConsumableArray;
var _toConsumableArray2 = interopRequireDefault(toConsumableArray);
var poolNames = {
  functions: "Jexl Function",
  transforms: "Transform"
};
var ArrayLiteral = function(ast) {
  return this.evalArray(ast.value);
};
var BinaryExpression = function(ast) {
  var _this = this;
  var grammarOp = this._grammar.elements[ast.operator];
  if (grammarOp.evalOnDemand) {
    var wrap = function wrap2(subAst) {
      return {
        eval: function _eval() {
          return _this.eval(subAst);
        }
      };
    };
    return grammarOp.evalOnDemand(wrap(ast.left), wrap(ast.right));
  }
  return this.Promise.all([this.eval(ast.left), this.eval(ast.right)]).then(function(arr) {
    return grammarOp.eval(arr[0], arr[1]);
  });
};
var ConditionalExpression = function(ast) {
  var _this2 = this;
  return this.eval(ast.test).then(function(res) {
    if (res) {
      if (ast.consequent) {
        return _this2.eval(ast.consequent);
      }
      return res;
    }
    return _this2.eval(ast.alternate);
  });
};
var FilterExpression = function(ast) {
  var _this3 = this;
  return this.eval(ast.subject).then(function(subject) {
    if (ast.relative) {
      return _this3._filterRelative(subject, ast.expr);
    }
    return _this3._filterStatic(subject, ast.expr);
  });
};
var Identifier = function(ast) {
  if (!ast.from) {
    return ast.relative ? this._relContext[ast.value] : this._context[ast.value];
  }
  return this.eval(ast.from).then(function(context) {
    if (context === void 0 || context === null) {
      return void 0;
    }
    if (Array.isArray(context)) {
      context = context[0];
    }
    return context[ast.value];
  });
};
var Literal = function(ast) {
  return ast.value;
};
var ObjectLiteral = function(ast) {
  return this.evalMap(ast.value);
};
var FunctionCall = function(ast) {
  var poolName = poolNames[ast.pool];
  if (!poolName) {
    throw new Error("Corrupt AST: Pool '".concat(ast.pool, "' not found"));
  }
  var pool = this._grammar[ast.pool];
  var func = pool[ast.name];
  if (!func) {
    throw new Error("".concat(poolName, " ").concat(ast.name, " is not defined."));
  }
  return this.evalArray(ast.args || []).then(function(args) {
    return func.apply(void 0, (0, _toConsumableArray2.default)(args));
  });
};
var UnaryExpression = function(ast) {
  var _this4 = this;
  return this.eval(ast.right).then(function(right) {
    return _this4._grammar.elements[ast.operator].eval(right);
  });
};
var handlers = {
  ArrayLiteral,
  BinaryExpression,
  ConditionalExpression,
  FilterExpression,
  Identifier,
  Literal,
  ObjectLiteral,
  FunctionCall,
  UnaryExpression
};
var _classCallCheck2 = interopRequireDefault(classCallCheck);
var _createClass2 = interopRequireDefault(createClass);
var Evaluator = /* @__PURE__ */ function() {
  function Evaluator2(grammar2, context, relativeContext) {
    var promise = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : Promise;
    (0, _classCallCheck2.default)(this, Evaluator2);
    this._grammar = grammar2;
    this._context = context || {};
    this._relContext = relativeContext || this._context;
    this.Promise = promise;
  }
  (0, _createClass2.default)(Evaluator2, [{
    key: "eval",
    value: function _eval(ast) {
      var _this = this;
      return this.Promise.resolve().then(function() {
        return handlers[ast.type].call(_this, ast);
      });
    }
  }, {
    key: "evalArray",
    value: function evalArray(arr) {
      var _this2 = this;
      return this.Promise.all(arr.map(function(elem) {
        return _this2.eval(elem);
      }));
    }
  }, {
    key: "evalMap",
    value: function evalMap(map) {
      var _this3 = this;
      var keys = Object.keys(map);
      var result = {};
      var asts = keys.map(function(key) {
        return _this3.eval(map[key]);
      });
      return this.Promise.all(asts).then(function(vals) {
        vals.forEach(function(val, idx) {
          result[keys[idx]] = val;
        });
        return result;
      });
    }
  }, {
    key: "_filterRelative",
    value: function _filterRelative(subject, expr) {
      var _this4 = this;
      var promises = [];
      if (!Array.isArray(subject)) {
        subject = subject === void 0 ? [] : [subject];
      }
      subject.forEach(function(elem) {
        var evalInst = new Evaluator2(_this4._grammar, _this4._context, elem, _this4.Promise);
        promises.push(evalInst.eval(expr));
      });
      return this.Promise.all(promises).then(function(values) {
        var results = [];
        values.forEach(function(value, idx) {
          if (value) {
            results.push(subject[idx]);
          }
        });
        return results;
      });
    }
  }, {
    key: "_filterStatic",
    value: function _filterStatic(subject, expr) {
      return this.eval(expr).then(function(res) {
        if (typeof res === "boolean") {
          return res ? subject : void 0;
        }
        return subject[res];
      });
    }
  }]);
  return Evaluator2;
}();
var Evaluator_1 = Evaluator;
var _classCallCheck2$1 = interopRequireDefault(classCallCheck);
var _createClass2$1 = interopRequireDefault(createClass);
var numericRegex = /^-?(?:(?:[0-9]*\.[0-9]+)|[0-9]+)$/;
var identRegex = /^[a-zA-Zа-яА-Я_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF$][a-zA-Zа-яА-Я0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF$]*$/;
var escEscRegex = /\\\\/;
var whitespaceRegex = /^\s*$/;
var preOpRegexElems = [
  "'(?:(?:\\\\')|[^'])*'",
  '"(?:(?:\\\\")|[^"])*"',
  "\\s+",
  "\\btrue\\b",
  "\\bfalse\\b"
];
var postOpRegexElems = [
  "[a-zA-Z\u0430-\u044F\u0410-\u042F_\xC0-\xD6\xD8-\xF6\xF8-\xFF\\$][a-zA-Z0-9\u0430-\u044F\u0410-\u042F_\xC0-\xD6\xD8-\xF6\xF8-\xFF\\$]*",
  "(?:(?:[0-9]*\\.[0-9]+)|[0-9]+)"
];
var minusNegatesAfter = ["binaryOp", "unaryOp", "openParen", "openBracket", "question", "colon"];
var Lexer = /* @__PURE__ */ function() {
  function Lexer2(grammar2) {
    (0, _classCallCheck2$1.default)(this, Lexer2);
    this._grammar = grammar2;
  }
  (0, _createClass2$1.default)(Lexer2, [{
    key: "getElements",
    value: function getElements(str) {
      var regex = this._getSplitRegex();
      return str.split(regex).filter(function(elem) {
        return elem;
      });
    }
  }, {
    key: "getTokens",
    value: function getTokens(elements) {
      var tokens = [];
      var negate = false;
      for (var i = 0; i < elements.length; i++) {
        if (this._isWhitespace(elements[i])) {
          if (tokens.length) {
            tokens[tokens.length - 1].raw += elements[i];
          }
        } else if (elements[i] === "-" && this._isNegative(tokens)) {
          negate = true;
        } else {
          if (negate) {
            elements[i] = "-" + elements[i];
            negate = false;
          }
          tokens.push(this._createToken(elements[i]));
        }
      }
      if (negate) {
        tokens.push(this._createToken("-"));
      }
      return tokens;
    }
  }, {
    key: "tokenize",
    value: function tokenize(str) {
      var elements = this.getElements(str);
      return this.getTokens(elements);
    }
  }, {
    key: "_createToken",
    value: function _createToken(element) {
      var token = {
        type: "literal",
        value: element,
        raw: element
      };
      if (element[0] === '"' || element[0] === "'") {
        token.value = this._unquote(element);
      } else if (element.match(numericRegex)) {
        token.value = parseFloat(element);
      } else if (element === "true" || element === "false") {
        token.value = element === "true";
      } else if (this._grammar.elements[element]) {
        token.type = this._grammar.elements[element].type;
      } else if (element.match(identRegex)) {
        token.type = "identifier";
      } else {
        throw new Error("Invalid expression token: ".concat(element));
      }
      return token;
    }
  }, {
    key: "_escapeRegExp",
    value: function _escapeRegExp(str) {
      str = str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (str.match(identRegex)) {
        str = "\\b" + str + "\\b";
      }
      return str;
    }
  }, {
    key: "_getSplitRegex",
    value: function _getSplitRegex() {
      var _this = this;
      if (!this._splitRegex) {
        var elemArray = Object.keys(this._grammar.elements).sort(function(a, b) {
          return b.length - a.length;
        }).map(function(elem) {
          return _this._escapeRegExp(elem);
        }, this);
        this._splitRegex = new RegExp("(" + [preOpRegexElems.join("|"), elemArray.join("|"), postOpRegexElems.join("|")].join("|") + ")");
      }
      return this._splitRegex;
    }
  }, {
    key: "_isNegative",
    value: function _isNegative(tokens) {
      if (!tokens.length)
        return true;
      return minusNegatesAfter.some(function(type) {
        return type === tokens[tokens.length - 1].type;
      });
    }
  }, {
    key: "_isWhitespace",
    value: function _isWhitespace(str) {
      return !!str.match(whitespaceRegex);
    }
  }, {
    key: "_unquote",
    value: function _unquote(str) {
      var quote = str[0];
      var escQuoteRegex = new RegExp("\\\\" + quote, "g");
      return str.substr(1, str.length - 2).replace(escQuoteRegex, quote).replace(escEscRegex, "\\");
    }
  }]);
  return Lexer2;
}();
var Lexer_1 = Lexer;
var argVal = function(ast) {
  if (ast)
    this._cursor.args.push(ast);
};
var arrayStart = function() {
  this._placeAtCursor({
    type: "ArrayLiteral",
    value: []
  });
};
var arrayVal = function(ast) {
  if (ast) {
    this._cursor.value.push(ast);
  }
};
var binaryOp = function(token) {
  var precedence = this._grammar.elements[token.value].precedence || 0;
  var parent = this._cursor._parent;
  while (parent && parent.operator && this._grammar.elements[parent.operator].precedence >= precedence) {
    this._cursor = parent;
    parent = parent._parent;
  }
  var node = {
    type: "BinaryExpression",
    operator: token.value,
    left: this._cursor
  };
  this._setParent(this._cursor, node);
  this._cursor = parent;
  this._placeAtCursor(node);
};
var dot = function() {
  this._nextIdentEncapsulate = this._cursor && this._cursor.type !== "UnaryExpression" && (this._cursor.type !== "BinaryExpression" || this._cursor.type === "BinaryExpression" && this._cursor.right);
  this._nextIdentRelative = !this._cursor || this._cursor && !this._nextIdentEncapsulate;
  if (this._nextIdentRelative) {
    this._relative = true;
  }
};
var filter = function(ast) {
  this._placeBeforeCursor({
    type: "FilterExpression",
    expr: ast,
    relative: this._subParser.isRelative(),
    subject: this._cursor
  });
};
var functionCall = function() {
  this._placeBeforeCursor({
    type: "FunctionCall",
    name: this._cursor.value,
    args: [],
    pool: "functions"
  });
};
var identifier = function(token) {
  var node = {
    type: "Identifier",
    value: token.value
  };
  if (this._nextIdentEncapsulate) {
    node.from = this._cursor;
    this._placeBeforeCursor(node);
    this._nextIdentEncapsulate = false;
  } else {
    if (this._nextIdentRelative) {
      node.relative = true;
      this._nextIdentRelative = false;
    }
    this._placeAtCursor(node);
  }
};
var literal = function(token) {
  this._placeAtCursor({
    type: "Literal",
    value: token.value
  });
};
var objKey = function(token) {
  this._curObjKey = token.value;
};
var objStart = function() {
  this._placeAtCursor({
    type: "ObjectLiteral",
    value: {}
  });
};
var objVal = function(ast) {
  this._cursor.value[this._curObjKey] = ast;
};
var subExpression = function(ast) {
  this._placeAtCursor(ast);
};
var ternaryEnd = function(ast) {
  this._cursor.alternate = ast;
};
var ternaryMid = function(ast) {
  this._cursor.consequent = ast;
};
var ternaryStart = function() {
  this._tree = {
    type: "ConditionalExpression",
    test: this._tree
  };
  this._cursor = this._tree;
};
var transform = function(token) {
  this._placeBeforeCursor({
    type: "FunctionCall",
    name: token.value,
    args: [this._cursor],
    pool: "transforms"
  });
};
var unaryOp = function(token) {
  this._placeAtCursor({
    type: "UnaryExpression",
    operator: token.value
  });
};
var handlers$1 = {
  argVal,
  arrayStart,
  arrayVal,
  binaryOp,
  dot,
  filter,
  functionCall,
  identifier,
  literal,
  objKey,
  objStart,
  objVal,
  subExpression,
  ternaryEnd,
  ternaryMid,
  ternaryStart,
  transform,
  unaryOp
};
var states_1 = {
  expectOperand: {
    tokenTypes: {
      literal: {
        toState: "expectBinOp"
      },
      identifier: {
        toState: "identifier"
      },
      unaryOp: {},
      openParen: {
        toState: "subExpression"
      },
      openCurl: {
        toState: "expectObjKey",
        handler: handlers$1.objStart
      },
      dot: {
        toState: "traverse"
      },
      openBracket: {
        toState: "arrayVal",
        handler: handlers$1.arrayStart
      }
    }
  },
  expectBinOp: {
    tokenTypes: {
      binaryOp: {
        toState: "expectOperand"
      },
      pipe: {
        toState: "expectTransform"
      },
      dot: {
        toState: "traverse"
      },
      question: {
        toState: "ternaryMid",
        handler: handlers$1.ternaryStart
      }
    },
    completable: true
  },
  expectTransform: {
    tokenTypes: {
      identifier: {
        toState: "postTransform",
        handler: handlers$1.transform
      }
    }
  },
  expectObjKey: {
    tokenTypes: {
      identifier: {
        toState: "expectKeyValSep",
        handler: handlers$1.objKey
      },
      closeCurl: {
        toState: "expectBinOp"
      }
    }
  },
  expectKeyValSep: {
    tokenTypes: {
      colon: {
        toState: "objVal"
      }
    }
  },
  postTransform: {
    tokenTypes: {
      openParen: {
        toState: "argVal"
      },
      binaryOp: {
        toState: "expectOperand"
      },
      dot: {
        toState: "traverse"
      },
      openBracket: {
        toState: "filter"
      },
      pipe: {
        toState: "expectTransform"
      }
    },
    completable: true
  },
  postArgs: {
    tokenTypes: {
      binaryOp: {
        toState: "expectOperand"
      },
      dot: {
        toState: "traverse"
      },
      openBracket: {
        toState: "filter"
      },
      pipe: {
        toState: "expectTransform"
      }
    },
    completable: true
  },
  identifier: {
    tokenTypes: {
      binaryOp: {
        toState: "expectOperand"
      },
      dot: {
        toState: "traverse"
      },
      openBracket: {
        toState: "filter"
      },
      openParen: {
        toState: "argVal",
        handler: handlers$1.functionCall
      },
      pipe: {
        toState: "expectTransform"
      },
      question: {
        toState: "ternaryMid",
        handler: handlers$1.ternaryStart
      }
    },
    completable: true
  },
  traverse: {
    tokenTypes: {
      identifier: {
        toState: "identifier"
      }
    }
  },
  filter: {
    subHandler: handlers$1.filter,
    endStates: {
      closeBracket: "identifier"
    }
  },
  subExpression: {
    subHandler: handlers$1.subExpression,
    endStates: {
      closeParen: "expectBinOp"
    }
  },
  argVal: {
    subHandler: handlers$1.argVal,
    endStates: {
      comma: "argVal",
      closeParen: "postArgs"
    }
  },
  objVal: {
    subHandler: handlers$1.objVal,
    endStates: {
      comma: "expectObjKey",
      closeCurl: "expectBinOp"
    }
  },
  arrayVal: {
    subHandler: handlers$1.arrayVal,
    endStates: {
      comma: "arrayVal",
      closeBracket: "expectBinOp"
    }
  },
  ternaryMid: {
    subHandler: handlers$1.ternaryMid,
    endStates: {
      colon: "ternaryEnd"
    }
  },
  ternaryEnd: {
    subHandler: handlers$1.ternaryEnd,
    completable: true
  }
};
var states = {
  states: states_1
};
var _classCallCheck2$2 = interopRequireDefault(classCallCheck);
var _createClass2$2 = interopRequireDefault(createClass);
var states$1 = states.states;
var Parser = /* @__PURE__ */ function() {
  function Parser2(grammar2, prefix, stopMap) {
    (0, _classCallCheck2$2.default)(this, Parser2);
    this._grammar = grammar2;
    this._state = "expectOperand";
    this._tree = null;
    this._exprStr = prefix || "";
    this._relative = false;
    this._stopMap = stopMap || {};
  }
  (0, _createClass2$2.default)(Parser2, [{
    key: "addToken",
    value: function addToken(token) {
      if (this._state === "complete") {
        throw new Error("Cannot add a new token to a completed Parser");
      }
      var state = states$1[this._state];
      var startExpr = this._exprStr;
      this._exprStr += token.raw;
      if (state.subHandler) {
        if (!this._subParser) {
          this._startSubExpression(startExpr);
        }
        var stopState = this._subParser.addToken(token);
        if (stopState) {
          this._endSubExpression();
          if (this._parentStop)
            return stopState;
          this._state = stopState;
        }
      } else if (state.tokenTypes[token.type]) {
        var typeOpts = state.tokenTypes[token.type];
        var handleFunc = handlers$1[token.type];
        if (typeOpts.handler) {
          handleFunc = typeOpts.handler;
        }
        if (handleFunc) {
          handleFunc.call(this, token);
        }
        if (typeOpts.toState) {
          this._state = typeOpts.toState;
        }
      } else if (this._stopMap[token.type]) {
        return this._stopMap[token.type];
      } else {
        throw new Error("Token ".concat(token.raw, " (").concat(token.type, ") unexpected in expression: ").concat(this._exprStr));
      }
      return false;
    }
  }, {
    key: "addTokens",
    value: function addTokens(tokens) {
      tokens.forEach(this.addToken, this);
    }
  }, {
    key: "complete",
    value: function complete() {
      if (this._cursor && !states$1[this._state].completable) {
        throw new Error("Unexpected end of expression: ".concat(this._exprStr));
      }
      if (this._subParser) {
        this._endSubExpression();
      }
      this._state = "complete";
      return this._cursor ? this._tree : null;
    }
  }, {
    key: "isRelative",
    value: function isRelative() {
      return this._relative;
    }
  }, {
    key: "_endSubExpression",
    value: function _endSubExpression() {
      states$1[this._state].subHandler.call(this, this._subParser.complete());
      this._subParser = null;
    }
  }, {
    key: "_placeAtCursor",
    value: function _placeAtCursor(node) {
      if (!this._cursor) {
        this._tree = node;
      } else {
        this._cursor.right = node;
        this._setParent(node, this._cursor);
      }
      this._cursor = node;
    }
  }, {
    key: "_placeBeforeCursor",
    value: function _placeBeforeCursor(node) {
      this._cursor = this._cursor._parent;
      this._placeAtCursor(node);
    }
  }, {
    key: "_setParent",
    value: function _setParent(node, parent) {
      Object.defineProperty(node, "_parent", {
        value: parent,
        writable: true
      });
    }
  }, {
    key: "_startSubExpression",
    value: function _startSubExpression(exprStr) {
      var endStates = states$1[this._state].endStates;
      if (!endStates) {
        this._parentStop = true;
        endStates = this._stopMap;
      }
      this._subParser = new Parser2(this._grammar, exprStr, endStates);
    }
  }]);
  return Parser2;
}();
var Parser_1 = Parser;
var _classCallCheck2$3 = interopRequireDefault(classCallCheck);
var _createClass2$3 = interopRequireDefault(createClass);
var PromiseSync = /* @__PURE__ */ function() {
  function PromiseSync2(fn) {
    (0, _classCallCheck2$3.default)(this, PromiseSync2);
    fn(this._resolve.bind(this), this._reject.bind(this));
  }
  (0, _createClass2$3.default)(PromiseSync2, [{
    key: "catch",
    value: function _catch(rejected) {
      if (this.error) {
        try {
          this._resolve(rejected(this.error));
        } catch (e) {
          this._reject(e);
        }
      }
      return this;
    }
  }, {
    key: "then",
    value: function then(resolved, rejected) {
      if (!this.error) {
        try {
          this._resolve(resolved(this.value));
        } catch (e) {
          this._reject(e);
        }
      }
      if (rejected)
        this.catch(rejected);
      return this;
    }
  }, {
    key: "_reject",
    value: function _reject(error) {
      this.value = void 0;
      this.error = error;
    }
  }, {
    key: "_resolve",
    value: function _resolve(val) {
      if (val instanceof PromiseSync2) {
        if (val.error) {
          this._reject(val.error);
        } else {
          this._resolve(val.value);
        }
      } else {
        this.value = val;
        this.error = void 0;
      }
    }
  }]);
  return PromiseSync2;
}();
PromiseSync.all = function(vals) {
  return new PromiseSync(function(resolve) {
    var resolved = vals.map(function(val) {
      while (val instanceof PromiseSync) {
        if (val.error)
          throw Error(val.error);
        val = val.value;
      }
      return val;
    });
    resolve(resolved);
  });
};
PromiseSync.resolve = function(val) {
  return new PromiseSync(function(resolve) {
    return resolve(val);
  });
};
PromiseSync.reject = function(error) {
  return new PromiseSync(function(resolve, reject) {
    return reject(error);
  });
};
var PromiseSync_1 = PromiseSync;
var _classCallCheck2$4 = interopRequireDefault(classCallCheck);
var _createClass2$4 = interopRequireDefault(createClass);
var Expression = /* @__PURE__ */ function() {
  function Expression2(grammar2, exprStr) {
    (0, _classCallCheck2$4.default)(this, Expression2);
    this._grammar = grammar2;
    this._exprStr = exprStr;
    this._ast = null;
  }
  (0, _createClass2$4.default)(Expression2, [{
    key: "compile",
    value: function compile() {
      var lexer = new Lexer_1(this._grammar);
      var parser = new Parser_1(this._grammar);
      var tokens = lexer.tokenize(this._exprStr);
      parser.addTokens(tokens);
      this._ast = parser.complete();
      return this;
    }
  }, {
    key: "eval",
    value: function _eval() {
      var context = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      return this._eval(context, Promise);
    }
  }, {
    key: "evalSync",
    value: function evalSync() {
      var context = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      var res = this._eval(context, PromiseSync_1);
      if (res.error)
        throw res.error;
      return res.value;
    }
  }, {
    key: "_eval",
    value: function _eval(context, promise) {
      var _this = this;
      return promise.resolve().then(function() {
        var ast = _this._getAst();
        var evaluator = new Evaluator_1(_this._grammar, context, void 0, promise);
        return evaluator.eval(ast);
      });
    }
  }, {
    key: "_getAst",
    value: function _getAst() {
      if (!this._ast)
        this.compile();
      return this._ast;
    }
  }]);
  return Expression2;
}();
var Expression_1 = Expression;
var getGrammar = function() {
  return {
    elements: {
      ".": {
        type: "dot"
      },
      "[": {
        type: "openBracket"
      },
      "]": {
        type: "closeBracket"
      },
      "|": {
        type: "pipe"
      },
      "{": {
        type: "openCurl"
      },
      "}": {
        type: "closeCurl"
      },
      ":": {
        type: "colon"
      },
      ",": {
        type: "comma"
      },
      "(": {
        type: "openParen"
      },
      ")": {
        type: "closeParen"
      },
      "?": {
        type: "question"
      },
      "+": {
        type: "binaryOp",
        precedence: 30,
        eval: function _eval(left, right) {
          return left + right;
        }
      },
      "-": {
        type: "binaryOp",
        precedence: 30,
        eval: function _eval(left, right) {
          return left - right;
        }
      },
      "*": {
        type: "binaryOp",
        precedence: 40,
        eval: function _eval(left, right) {
          return left * right;
        }
      },
      "/": {
        type: "binaryOp",
        precedence: 40,
        eval: function _eval(left, right) {
          return left / right;
        }
      },
      "//": {
        type: "binaryOp",
        precedence: 40,
        eval: function _eval(left, right) {
          return Math.floor(left / right);
        }
      },
      "%": {
        type: "binaryOp",
        precedence: 50,
        eval: function _eval(left, right) {
          return left % right;
        }
      },
      "^": {
        type: "binaryOp",
        precedence: 50,
        eval: function _eval(left, right) {
          return Math.pow(left, right);
        }
      },
      "==": {
        type: "binaryOp",
        precedence: 20,
        eval: function _eval(left, right) {
          return left == right;
        }
      },
      "!=": {
        type: "binaryOp",
        precedence: 20,
        eval: function _eval(left, right) {
          return left != right;
        }
      },
      ">": {
        type: "binaryOp",
        precedence: 20,
        eval: function _eval(left, right) {
          return left > right;
        }
      },
      ">=": {
        type: "binaryOp",
        precedence: 20,
        eval: function _eval(left, right) {
          return left >= right;
        }
      },
      "<": {
        type: "binaryOp",
        precedence: 20,
        eval: function _eval(left, right) {
          return left < right;
        }
      },
      "<=": {
        type: "binaryOp",
        precedence: 20,
        eval: function _eval(left, right) {
          return left <= right;
        }
      },
      "&&": {
        type: "binaryOp",
        precedence: 10,
        evalOnDemand: function evalOnDemand(left, right) {
          return left.eval().then(function(leftVal) {
            if (!leftVal)
              return leftVal;
            return right.eval();
          });
        }
      },
      "||": {
        type: "binaryOp",
        precedence: 10,
        evalOnDemand: function evalOnDemand(left, right) {
          return left.eval().then(function(leftVal) {
            if (leftVal)
              return leftVal;
            return right.eval();
          });
        }
      },
      in: {
        type: "binaryOp",
        precedence: 20,
        eval: function _eval(left, right) {
          if (typeof right === "string") {
            return right.indexOf(left) !== -1;
          }
          if (Array.isArray(right)) {
            return right.some(function(elem) {
              return elem === left;
            });
          }
          return false;
        }
      },
      "!": {
        type: "unaryOp",
        precedence: Infinity,
        eval: function _eval(right) {
          return !right;
        }
      }
    },
    functions: {},
    transforms: {}
  };
};
var grammar = {
  getGrammar
};
var _defineProperty2 = interopRequireDefault(defineProperty);
var _classCallCheck2$5 = interopRequireDefault(classCallCheck);
var _createClass2$5 = interopRequireDefault(createClass);
var getGrammar$1 = grammar.getGrammar;
var Jexl = /* @__PURE__ */ function() {
  function Jexl2() {
    (0, _classCallCheck2$5.default)(this, Jexl2);
    this.expr = this.expr.bind(this);
    this._grammar = getGrammar$1();
  }
  (0, _createClass2$5.default)(Jexl2, [{
    key: "addBinaryOp",
    value: function addBinaryOp(operator, precedence, fn, manualEval) {
      this._addGrammarElement(operator, (0, _defineProperty2.default)({
        type: "binaryOp",
        precedence
      }, manualEval ? "evalOnDemand" : "eval", fn));
    }
  }, {
    key: "addFunction",
    value: function addFunction(name, fn) {
      this._grammar.functions[name] = fn;
    }
  }, {
    key: "addFunctions",
    value: function addFunctions(map) {
      for (var key in map) {
        this._grammar.functions[key] = map[key];
      }
    }
  }, {
    key: "addUnaryOp",
    value: function addUnaryOp(operator, fn) {
      this._addGrammarElement(operator, {
        type: "unaryOp",
        weight: Infinity,
        eval: fn
      });
    }
  }, {
    key: "addTransform",
    value: function addTransform(name, fn) {
      this._grammar.transforms[name] = fn;
    }
  }, {
    key: "addTransforms",
    value: function addTransforms(map) {
      for (var key in map) {
        this._grammar.transforms[key] = map[key];
      }
    }
  }, {
    key: "compile",
    value: function compile(expression) {
      var exprObj = this.createExpression(expression);
      return exprObj.compile();
    }
  }, {
    key: "createExpression",
    value: function createExpression(expression) {
      return new Expression_1(this._grammar, expression);
    }
  }, {
    key: "getFunction",
    value: function getFunction(name) {
      return this._grammar.functions[name];
    }
  }, {
    key: "getTransform",
    value: function getTransform(name) {
      return this._grammar.transforms[name];
    }
  }, {
    key: "eval",
    value: function _eval(expression) {
      var context = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      var exprObj = this.createExpression(expression);
      return exprObj.eval(context);
    }
  }, {
    key: "evalSync",
    value: function evalSync(expression) {
      var context = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      var exprObj = this.createExpression(expression);
      return exprObj.evalSync(context);
    }
  }, {
    key: "expr",
    value: function expr(strs) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      var exprStr = strs.reduce(function(acc, str, idx) {
        var arg = idx < args.length ? args[idx] : "";
        acc += str + arg;
        return acc;
      }, "");
      return this.createExpression(exprStr);
    }
  }, {
    key: "removeOp",
    value: function removeOp(operator) {
      if (this._grammar.elements[operator] && (this._grammar.elements[operator].type === "binaryOp" || this._grammar.elements[operator].type === "unaryOp")) {
        delete this._grammar.elements[operator];
      }
    }
  }, {
    key: "_addGrammarElement",
    value: function _addGrammarElement(str, obj) {
      this._grammar.elements[str] = obj;
    }
  }]);
  return Jexl2;
}();
var Jexl_1 = new Jexl();
var Jexl_2 = Jexl;
Jexl_1.Jexl = Jexl_2;
export default Jexl_1;
export {Jexl_2 as Jexl, Jexl_1 as __moduleExports};
