// Class declarations and expressions - parse half
// class A extends B { ... }
import { binary, token, expr, next, parse, keyword, word, skip, seek, cur, idx } from '../parse.js';
import { block } from './if.js';

const TOKEN = 200, PREFIX = 140, COMP = 90, STATIC = 175, CALL = 160;
const HERITAGE = CALL - .5;

// static member → ['static', member]
// STATIC > ACCESS (170) so `static m` doesn't pull `(` into the operand as a
// function call — leaves the `(` for the outer method-shorthand handler.
// `static async m()`: the async prefix (140) cannot fire at that precedence,
// so `async` before a member name (or #name, *gen, [computed]) on the same
// line is consumed here and wraps the operand the way async.js would:
// ['static', ['async', m]]. Anything else after `async` (`= 1`, `;`, a
// LineTerminator: `async` is then a field, the next line its own member) is
// a field named async.
const HASH = 35, STAR = 42, OBRACK = 91, LF = 10, CR = 13;
const nlAhead = (i) => { let c; while ((c = cur.charCodeAt(i)) <= 32) { if (c === LF || c === CR) return true; i++ } return false };
keyword('static', STATIC, () => {
  parse.space();
  const from = idx;
  if (word('async') && !nlAhead(idx + 5)) {
    skip(5); parse.space();
    const c = cur.charCodeAt(idx);
    if (parse.id(c) || c === HASH || c === STAR || c === OBRACK) return ['static', ['async', expr(STATIC - .5)]];
    seek(from);
  }
  return ['static', expr(STATIC - .5)];
});

// instanceof: object instanceof Constructor
binary('instanceof', COMP);

// #private fields: #x → '#x' (identifier starting with #)
token('#', TOKEN, a => {
  if (a) return;
  const id = next(parse.id);
  return id ? '#' + id : void 0;
});

// class [Name] [extends Base] { body }
keyword('class', TOKEN, () => {
  parse.space();
  let name = next(parse.id) || null;
  // 'extends' parsed as name? → anonymous class
  if (name === 'extends') {
    name = null;
    parse.space();
  } else {
    parse.space();
    if (!word('extends')) return ['class', name, null, block()];
    skip(7); // skip 'extends'
    parse.space();
  }
  return ['class', name, expr(HERITAGE), block()];
});
