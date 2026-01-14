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
import { token, expr, skip, space, err, parse, next, idx, cur } from '../../parse/pratt.js';

const STATEMENT = 5, ASSIGN = 20, EQ = 61;
const OBRACE = 123, CBRACE = 125, OBRACK = 91, CBRACK = 93, COLON = 58, COMMA = 44;

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
        def = expr(ASSIGN);
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
        const def = expr(ASSIGN);
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
    return [keyword, pattern, expr(ASSIGN)];  // Stop at comma level
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
// STATEMENT + 1 so expr(STATEMENT) can parse them (5 < 6)
// but semicolon at STATEMENT won't consume them
token('let', STATEMENT + 1, a => {
  if (a) return;
  return parseDecls('let', false);
});

// Override const to support patterns and multi-declaration
token('const', STATEMENT + 1, a => {
  if (a) return;
  return parseDecls('const', true);
});
