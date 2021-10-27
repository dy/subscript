// precedence order
// FIXME: rewrite operators as follows: (eventually [{.:args=>, (:args=>}, {!:args=>},...])
export const precedence = [
  ',',
  ['||'],
  ['&&'],
  '|',
  '^',
  '&',
  ['==','!='],
  ['<','<=','>','>=','in'],
  ['<<','>>','>>>'],
  ['+', '-'],
  ['*', '/', '%'],
  // '**',
  // ['!','~','+','-','++','--']
  '!',
  ['.', '('],
]

// FIXME: operators must take full args, not just pair: to directly map lisp constructs [op, ...args], not some reduce shchema
export const operators = {
  ',':(a,b)=>b,
  '||':(a,b)=>a||b,
  '&&':(a,b)=>a&&b,
  '|':(a,b)=>a|b,
  '^':(a,b)=>a^b,
  '&':(a,b)=>a&b,
  '!=':(a,b)=>a!=b,
  '==':(a,b)=>a==b,
  // ' in ':(a,b)=>a in b,
  '>=':(a,b)=>a>=b,
  '>':(a,b)=>a>b,
  '<=':(a,b)=>a<=b,
  '<':(a,b)=>a<b,
  '>>':(a,b)=>a>>b,
  '<<':(a,b)=>a<<b,
  '+':(a=0,b)=>b+a,
  '-':(a=0,b)=>a-b,
  '%':(a,b)=>a%b,
  '/':(a,b)=>a/b,
  '*':(a,b)=>a*b,
  // '**':(a,b)=>a**b,
  '!':(a,b)=>!b,
  // '~':(a,b)=>~b,
  '(':(a,b)=>a(b),
  '.':(a,b)=>a[b]
}

const nil = Symbol('nil')

// code → calltree
export function parse (seq) {
  let op=[], b, c, i, ref, cur=[0], v=[], u=[], g=['']

  // ref literals
  seq=seq
    // FIXME: quotes can be parsed in loop via htm method
    // FIXME: number can be detected as \d|.\d - maybe parse linearly too? no need for values...
    // or replace 1.xx with 1d12? or 1⅒12
    .replace(/"[^"\\\n\r]*"|\b\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?\b/g, m => `#v${v.push(m[0]=='"'?m:parseFloat(m))-1}`)
    // FIXME: can be detected directly in deref
    .replace(/\b(?:true|false|null)\b/g, m => `#v${v.push(m=='null'?null:m=='true')-1}`)
    .replace(/\.(\w+)\b/g, '."$1"') // a.b → a."b" // FIXME: can technically

  // ref groups
  // FIXME: redundant i, op assignments, g[cur[0]] vs buf
  for (i=0, b=''; i < seq.length;) {
    c=seq[i]
    if (c==' '||c=='\r'||c=='\n'||c=='\t') i++
    // a[b][c] → a.#b.#c
    // FIXME: seems like we have to create groups here: a(b,c) → [a, b, c], not [apply, a, [',',b,c]] - too much hassle unwrapping it later
    // FIXME: is it possible to enable recursion somehow? seems like group refs could be solved simpler
    // FIXME: ideally we'd merge it with psplit: make this first run is for (, [, . operators and call psplit from within, not after
    else if (c=='('||c=='[') {
      ref=g.push('')-1,
      g[cur[0]] += b + (c=='['? `.`: `(`) + `#g${ref}`
      cur.unshift(ref),
      op=[], i++, b=''
    }
    else if (c==')'||c==']') {
      g[cur[0]] += b, b=''
      cur.shift(), op=null, i++
    }
    else b+=c, op=null, i++
  }
  g[cur[0]]+=b

  // split by precedence
  for (op of precedence) g = g.map(s=>psplit(s,op))

  // unwrap
  const deref = s => {
    let c
    if (Array.isArray(s)) {
      // NOTE: we have to handle (, specially: parsing complexity, special folding, inverse precedence order
      if (s[0]=='(') {
        if (s[1][0]=='#') return deref(s[1]) // (a,b) → [,a,b] or [',',a,b]
        // a(b,c)(d) → [(, a, #g1, #g2] → [[a, b, c], d]
        console.log(s)
        return s.slice(1).reduce((a,b,c) => [deref(a), ...(c=deref(b),c[0]==','?c.slice(1):[c])]).filter(x=>x!=nil)
        // return [s[1].slice(0,-1)||undefined, ...deref(s[2]).slice(1).map(deref)]
      }
      return s.map(deref).filter(x=>x!=nil) // [[a,nil]] → [[a]]
    }

    if (s[0]=='#') c=s.slice(2), s = s[1]=='v'?v[c]:!g[c]?nil:deref(g[c])
    return s
  }

  return deref(g[0])
}
// FIXME: maybe still bring to extensibility?
// split by precedence
const psplit = (s, ops) => {
  if (Array.isArray(s)) return [s.shift(), ...s.map(s=>psplit(s,ops))]

  let cur, op, un=[], i=0, i0=0

  const commit=() => un.reduce((t,u)=>[u,t], s.slice(i0,i))

  for (;i<s.length;i++) {
    if (~(ops.indexOf(op=s[i]+s[i+1])) || ~(ops.indexOf(op=s[i]))) {
      if (i>i0) {
        if (!cur) cur = [op]
        cur.push(commit()) // 1+2+3 → [+,1,2,3]
        un = []
        if (op != cur[0]) cur=[op, cur] // 1+2-3 → [-,[+, 1, 2],3]
      }
      else un.push(op)
      i0=i+op.length
    }
  }
  if (!cur) return commit()
  if (i>i0) cur.push(commit())
  return cur
}

// calltree → result
export const evaluate = (seq, ctx={}, f,k) => Array.isArray(seq)
// FIXME: possibly we have to reduce not pairs but full args
  ? (f=ctx[seq[0]]||operators[seq[0]], seq=seq.slice(1).map(x=>seq.length<2 ? f(void 0,seq[0]) : seq.reduce(f)))
  : typeof seq === 'string' ? (seq[0] === '"' ? seq.slice(1,-1) : ctx[seq])
  : seq

// code → evaluator
export default (seq) => (seq = typeof seq === 'string' ? parse(seq) : seq, ctx => evaluate(seq, ctx))

// const dprop = (obj, key)=> key.split('.').reduce((a,b)=>b?a?.[b]:a, obj)

// // remove quote
// const unq = s => s[0]=='"'?s.slice(1,-1):s
