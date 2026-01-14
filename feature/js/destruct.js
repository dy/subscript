/**
 * Destructuring in variable declarations
 *
 * AST:
 *   const {a, b} = x   → ['const', ['{}', 'a', 'b'], val]
 *   const [a, b] = x   → ['const', ['[]', 'a', 'b'], val]
 *   const {a: x} = y   → ['const', ['{}', [':', 'a', 'x']], val]
 *   const {a = 1} = x  → ['const', ['{}', ['=', 'a', default]], val]
 *
 * Patterns can be nested: const {a: {b}} = x
 */
import { token, expr, skip, space, err, parse, next, lookup, idx, cur } from '../../src/parse.js';
import { operator, compile } from '../../src/compile.js';
import { PREC_STATEMENT, PREC_ASSIGN, OBRACE, CBRACE, OBRACK, CBRACK, COLON, COMMA } from '../../src/const.js';
const EQ = 61;

// Parse destructuring pattern: identifier, {pattern}, or [pattern]
function parsePattern() {
  const cc = space();

  // Object pattern {a, b, c: d}
  if (cc === OBRACE) {
    skip();
    const props = [];
    while (space() !== CBRACE) {
      const key = next(parse.id);
      if (!key) err('Expected property name');
      let binding = key;
      const nc = space();
      // Rename: {a: b}
      if (nc === COLON) {
        skip();
        binding = parsePattern(); // recursive for nested
      }
      // Default: {a = 1}
      let def;
      if (space() === EQ) {
        skip();
        def = expr(PREC_ASSIGN);
      }
      props.push(def ? ['=', [':', key, binding], def] : [':', key, binding]);
      if (space() === COMMA) skip();
    }
    skip(); // }
    return ['{}', ...props];
  }

  // Array pattern [a, b, c]
  if (cc === OBRACK) {
    skip();
    const items = [];
    while (space() !== CBRACK) {
      // Handle holes: [,a,,b]
      if (cur.charCodeAt(idx) === COMMA) {
        items.push(null); // hole
        skip();
        continue;
      }
      // Handle rest pattern: [...rest]
      if (cur.charCodeAt(idx) === 46 && cur.charCodeAt(idx + 1) === 46 && cur.charCodeAt(idx + 2) === 46) {
        skip(3); // consume ...
        const restName = next(parse.id);
        if (!restName) err('Expected identifier after ...');
        items.push(['...', restName]);
        space() !== CBRACK && err('Rest element must be last');
        break;
      }
      let binding = parsePattern();
      // Default: [a = 1]
      if (space() === EQ) {
        skip();
        const def = expr(PREC_ASSIGN);
        binding = ['=', binding, def];
      }
      items.push(binding);
      if (space() === COMMA) skip();
    }
    skip(); // ]
    return ['[]', ...items];
  }

  // Simple identifier
  const name = next(parse.id);
  if (!name) err('Expected identifier or pattern');
  return name;
}

// Parse single declaration: pattern [= value]
function parseDecl(keyword, requireInit) {
  const pattern = parsePattern();
  space();
  if (cur.charCodeAt(idx) === EQ && cur.charCodeAt(idx + 1) !== EQ) {
    skip();
    return [keyword, pattern, expr(PREC_ASSIGN)];  // Stop at comma level
  }
  if (requireInit && typeof pattern !== 'string') err('Destructuring requires initializer');
  if (requireInit) err('Expected =');
  return [keyword, pattern];
}

// Skip comments by calling expr() which processes comment tokens
// Returns true if a comment was skipped
function skipComments() {
  let cc, skipped = false;
  while ((cc = space()) === 47) { // '/'
    const nc = cur.charCodeAt(idx + 1);
    if (nc === 47 || nc === 42) { // // or /*
      expr(0); // Let comment token handle it
      skipped = true;
    } else break;
  }
  return skipped;
}

// Parse multiple declarations: x = 1, y = 2
function parseDecls(keyword, requireInit) {
  const decls = [];
  do {
    skipComments();
    decls.push(parseDecl(keyword, requireInit));
    space();
    if (cur.charCodeAt(idx) !== COMMA) break;
    skip(); // consume comma
    skipComments();
    // Check if there's more content (not EOF or statement terminator)
    const nc = space();
    if (!nc || nc === 59) break; // EOF or semicolon - stop
  } while (true);

  return decls.length === 1 ? decls[0] : [';', ...decls];
}

// Override let to support patterns and multi-declaration
// PREC_STATEMENT + 1 so expr(PREC_STATEMENT) can parse them (5 < 6)
// but semicolon at PREC_STATEMENT won't consume them
token('let', PREC_STATEMENT + 1, a => {
  if (a) return;
  return parseDecls('let', false);
});

// Override const to support patterns and multi-declaration
token('const', PREC_STATEMENT + 1, a => {
  if (a) return;
  return parseDecls('const', true);
});

// Destructure value into context
function destructure(pattern, value, ctx) {
  // Simple binding
  if (typeof pattern === 'string') {
    ctx[pattern] = value;
    return;
  }

  const [op, ...items] = pattern;

  // Object destructuring
  if (op === '{}') {
    for (const item of items) {
      // item is [':', key, binding] or ['=', [':', key, binding], default]
      let key, binding, def;
      if (item[0] === '=') {
        [, [, key, binding], def] = item;
      } else {
        [, key, binding] = item;
      }
      let val = value[key];
      if (val === undefined && def) val = compile(def)(ctx);
      destructure(binding, val, ctx);
    }
    return;
  }

  // Array destructuring
  if (op === '[]') {
    let i = 0;
    for (const item of items.slice(0)) { // items after op
      if (item === null) { i++; continue; } // hole
      // Rest pattern: [...rest]
      if (Array.isArray(item) && item[0] === '...') {
        ctx[item[1]] = value.slice(i);
        break;
      }
      let binding = item, def;
      // Default value
      if (Array.isArray(item) && item[0] === '=') {
        [, binding, def] = item;
      }
      let val = value[i++];
      if (val === undefined && def) val = compile(def)(ctx);
      destructure(binding, val, ctx);
    }
    return;
  }
}

// Override let operator
operator('let', (pattern, val) => {
  if (typeof pattern === 'string') {
    // Simple binding
    val = val !== undefined ? compile(val) : null;
    return ctx => { ctx[pattern] = val ? val(ctx) : undefined; };
  }
  // Destructuring
  val = compile(val);
  return ctx => destructure(pattern, val(ctx), ctx);
});

// Override const operator
operator('const', (pattern, val) => {
  val = compile(val);
  if (typeof pattern === 'string') {
    return ctx => { ctx[pattern] = val(ctx); };
  }
  // Destructuring
  return ctx => destructure(pattern, val(ctx), ctx);
});
