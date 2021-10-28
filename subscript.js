// operators in precedence order
// number of arguments:
// + indicates unary, binary or ternary
// + directly map calltree nodes [op, ...args] (not reduce heuristic)
// + makes ops fns useful on its own (like dlv)
// + there are shortcuts or extensions for ||, && etc
// + makes simpler unary handling
// + same unaries/binaries ops can reside in different precedence
export const operators = [
  {
    '(':(a,...args)=>a(...args),
    '[':(a,...b)=>b.reduce((a,b)=>a?a[b]:a, a),
    '.':(a,...b)=>b.reduce((a,b)=>a?a[b]:a, a)
  },
  {
    '!':a=>!a,
    '~':a=>~a,
    '+':a=>+a,
    '-':a=>-a,
    '++':a=>++a,
    '--':a=>--a
  },
  // '**',
  {
    '%':(a,...b)=>b.reduce((a,b)=>a%b,a),
    '/':(a,...b)=>b.reduce((a,b)=>a/b,a),
    '*':(a,...b)=>b.reduce((a,b)=>a*b,a),
  },
  {
    '+':(a,...b)=>b.reduce((a,b)=>a+b,a),
    '-':(a,...b)=>b.reduce((a,b)=>a-b,a),
  },
  {
    '>>>':(a,b)=>a>>>b,
    '>>':(a,b)=>a>>b,
    '<<':(a,b)=>a<<b,
  },
  {
    // ' in ':(a,b)=>a in b,
    '>=':(a,b)=>a>=b,
    '>':(a,b)=>a>b,
    '<=':(a,b)=>a<=b,
    '<':(a,b)=>a<b,
  },
  {
    '!=':(a,b)=>a!=b,
    '==':(a,b)=>a==b,
  },
  {'&':(a,b)=>a&b},
  {'^':(a,b)=>a^b},
  {'|':(a,b)=>a|b},
  {'&&':(a,...b)=>a&&b.every(Boolean)},
  {'||':(a,...b)=>a||b.some(Boolean)},
  {'?:':(a,b,c)=>a?b:c},
  {',':(a,...b)=>b.length ? b[b.length-1] : a},
],

literal = {true:true, false:false, null:null, undefined:undefined},

operator = op => operators.find(o=>op in o)?.[op]

// code → calltree
export function parse (s) {
  let i=0,

  tokenize = (op, b='', n, q, c, cur=[]) => {
    const commit = (v, op) => {
      if (v) cur.push(n ? parseFloat(v) : v in literal ? literal[v] : v)
      if (op) cur.push(op)
      n=b=c=''
    }

    // FIXME: maybe commit operators as functions, not as string tokens?
    for (; i<=s.length; b+=c) {
      c = s[i++]
      if (q && c==q) q=''
      else if (n && (c=='e'||c=='E')) c+=s[i++]
      else if (c==' '||c=='\r'||c=='\n'||c=='\t') c=''
      else if (c=='"'||c=="'") q=c
      else if (!b && c>='0' && c<='9' || c=='.' && s[i]>='0' && s[i]<='9') n=1
      else if (c=='('||c=='[') commit(b, c), commit(tokenize())
      else if (!c||c==')'||c==']') return commit(b), group(cur)
      else if (operator(op=c+s[i])||operator(op=c)) commit(b, op)
    }
  }
  s=tokenize(s)

  return s
}

// group seq of tokens into calltree nodes by operator precedence
const group = (s) => {
  if (!s.length) return ''
  let g, res, op, i, ops, tok, un

  console.group('Group',s)
  const commit = tok => (g ? (console.log('commit', g, tok, un), g.push(tok), res.push(un.reduceRight((t,u)=>[u,t],g)), g=null) : res.push(...un, tok), un=null)

  operators.forEach((ops,p)=> {
    res=[], i=0, un=[]
    console.group(ops)
    for (;i<s.length;) {
      tok = s[i++]
      if (operator(op=tok)) { // operator
        if (!un) un = [], res.push(op)
        else un.push(op)
      }
      else { // literal
        console.log('literal', tok, un)
        if (i>=s.length) console.log('end', un), commit(tok)
        else if (~ops[op=s[i]]) { // a +
          if (!g) g = [op, tok]
          else if (op == g[0]) g.push(tok)
          else g.push(tok), g = [op, g]
          i++
        }
        else commit(tok)
      }
    }
    console.log('grouping result:',[...res])
    console.groupEnd()
    s=res
    // s = p ? res
    //   : res.map(s =>
    //     // fix call op: [(,a,[',',b,c],d] → [[a, b, c],c],  [(,a,''] → [a]
    //     s&&s[0] == '(' ?
    //       s.slice(1).reduce((a,b)=>[a].concat(!b?[]:b[0]==','?b.slice(1):[b])) :
    //     s&&s[0] == '.' ?
    //       [s[0],s[1], ...s.slice(2).map(a=>`"${a}"`)] :
    //     s
    //   )
  })

  console.groupEnd()

  return s.length>1?s:s[0]
}

// calltree → result
export const evaluate = (seq, ctx={}, f,k) => Array.isArray(seq)
// FIXME: possibly we have to reduce not pairs but full args
  ? (f=ctx[seq[0]]||operators[seq[0]], seq=seq.slice(1).map(x=>seq.length<2 ? f(void 0,seq[0]) : seq.reduce(f)))
  : typeof seq === 'string' ? (seq[0] === '"' ? seq.slice(1,-1) : ctx[seq])
  : seq

// code → evaluator
export default (seq) => (seq = typeof seq === 'string' ? parse(seq) : seq, ctx => evaluate(seq, ctx))

