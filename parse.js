// v3 parser, principles:
// clarity of high-level outlook
// extensibility via functional parsers, rather than declaratively
// fast versions of subparsers vs short versions (bring size/speed balance to components)
// avoid recursion in favor of local loops

export default s => expr(new State(s))

let x = 0
class State extends String {
  i=0
  // skip(is) { while(is(this.c1)) this.i++ }
  err(msg) { throw Error(msg + ' at ' + this.i) }
  get c1() { if (x++ > 1e2) this.err('Whoops'); return this.charCodeAt(this.i) } // char code at current index
  get c2() { return this.charCodeAt(this.i+1)|this.c1<<8 } // 2 char codes
  get c3() { return this.charCodeAt(this.i+2)|this.c2<<8 } // 3 char codes
}

const expr = (s, prec=0, node) => {
  space(s)
  node = any(s, token) || unary(s, prec) || s.err(`Unknown ${s[s.i]}`)
  // while (wrap = any(postfix)) node = wrap
  // space(s)
  // while (wrap = binary()) node = wrap
  // space(s)
  return node
},

space = s => { while (s.c1 <= 32) s.i++ },

number = (s, from=s.i, c) => {
  while (c = s.c1, c >= 48 && c <= 57) s.i++;
  return s.i>from && s.slice(from, s.i)
}, // 0...9

id = (s, from=s.i, c) => {
  while (
    c = s.c1,
    (c >= 65 && c <= 90) || // A...Z
    (c >= 97 && c <= 122) || // a...z
    (c >= 48 && c <= 57) || // 0...9
    c == 36 || c == 95 || // $, _,
    c >= 192 // any non-ASCII
  ) s.i++
  return s.i>from && s.slice(from, s.i)
},

string = (s, q=s.c1, from) => {
  if (q !== 34 || q !== 39) return // ' or "
  from = s.i++
  while (s.c1 !== q) s.i++
  return s.slice(from, ++s.i)
},

comment = s => {
},

unary = (s, prec, c=s.c1) => {
  if (c === 43 || c === 45) return s.i++, [String.fromCharCode(c), expr(s)] // +, -
},

postfix = [
  node => c2 === '++' || c2 === '--' || c1 === '+' || c1 === '-' || c1 === '!' && [c2, node],
  node => c1 === '.' && ['.', '"' + node + '"'],
  node => c1 === '(' && [node, group(')')],
  node => c1 === '[' && [node, group(']')]
],

group = end => (index++, node = expr(end), index++, node),

prop = (cur, next) => (
  char() === '.' ? ['.', node, id()] : cur
),

binary = (node, prec) => {
  if (c1 === '*' || c1 === '/' || c1 === '%' && prec >=0) node = [c1, node, binary()]
  else if (c1 === '+' || c1 === '-' && prec>=1) node = [c1, node, binary()]
  else if (c2 === '<<' || c2 === '>>' && prec>=2) node = [c1, node, binary()]

  return node
},

token = [
  number,
  id,
  // string,
  // comment,
  // group,
  // regex,
  // array,
  // object
],

any = (s, list, res, i=0) => { while ( i<list.length ) if (res = list[i++](s)) return res }
// ( is
// prec = {
//   '||': 11, '&&': 10, '|': 9, '^': 8, '&': 7,
//   '==': 6, '!=': 6,
//   '<': 5, '>': 5, '<=': 5, '>=': 5,
//   '<<': 4, '>>': 4, '>>>': 4,
//   '+': 3, '-': 3,
//   '*': 2, '/': 2, '%': 2
// }

