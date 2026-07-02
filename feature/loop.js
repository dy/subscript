// Loops: while, do-while, for, for await, break, continue, return - parse half
import { expr, skip, parse, word, keyword, parens, cur, idx, next, seek, prec } from '../parse.js';
import { body } from './if.js';

const STATEMENT = 5, CBRACE = 125, SEMI = 59;

keyword('while', STATEMENT + 1, () => (parse.space(), ['while', parens(), body()]));
keyword('do', STATEMENT + 1, b => (b = body(), parse.space(), skip(5), parse.space(), ['do', b, parens()]));

// A for-in/of head is not a plain expression: the grammar makes everything right of
// the keyword the iteration source, while expression precedence binds relational
// `in`/`of` tighter than assignment/sequence/ternary/logical — `for (k in o = x)`
// would parse as `(k in o) = x`, stranding the wrappers around the whole head.
// Splice them back: descend the leftmost spine through looser-than-`in` ops to the
// in/of node and swap it for its own right operand.
const head = (h, spine = h, parent) => {
  // decl capture: `for (let k in o = x)` lands as [let [= [in k o] x]] — splice the
  // source out of the declarator, keep the declaration on the iteration variable.
  if (Array.isArray(h) && h.length === 2 && (h[0] === 'let' || h[0] === 'const' || h[0] === 'var') && Array.isArray(h[1])) {
    const r = head(h[1]);
    return r !== h[1] ? [r[0], [h[0], r[1]], r[2]] : h;
  }
  while (Array.isArray(spine) && prec[spine[0]] < prec.in) parent = spine, spine = spine[1];
  return parent && Array.isArray(spine) && (spine[0] === 'in' || spine[0] === 'of')
    ? (parent[1] = spine[2], [spine[0], spine[1], h]) : h;
};

// for / for await
keyword('for', STATEMENT + 1, () => {
  parse.space();
  // for await (x of y)
  if (word('await')) {
    skip(5);
    return (parse.space(), ['for await', head(parens()), body()]);
  }
  return ['for', head(parens()), body()];
});

keyword('break', STATEMENT + 1, () => {
  parse.asi && (parse.newline = false);
  const from = idx;
  const c = parse.space();
  if (!c || c === CBRACE || c === SEMI || parse.newline) return ['break'];
  const label = next(parse.id);
  if (!label) return ['break'];
  const cc = parse.space();
  if (!cc || cc === CBRACE || cc === SEMI || parse.newline) return ['break', label];
  seek(from);
  return ['break'];
});
keyword('continue', STATEMENT + 1, () => {
  parse.asi && (parse.newline = false);
  const from = idx;
  const c = parse.space();
  if (!c || c === CBRACE || c === SEMI || parse.newline) return ['continue'];
  const label = next(parse.id);
  if (!label) return ['continue'];
  const cc = parse.space();
  if (!cc || cc === CBRACE || cc === SEMI || parse.newline) return ['continue', label];
  seek(from);
  return ['continue'];
});
keyword('return', STATEMENT + 1, () => {
  parse.asi && (parse.newline = false);
  const c = parse.space();
  return !c || c === CBRACE || c === SEMI || parse.newline ? ['return'] : ['return', expr(STATEMENT)];
});
