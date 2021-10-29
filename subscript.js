export const operator = [
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
  {',':(a,...b)=>b.length ? b[b.length-1] : a},
],

literal = {true:true, false:false, null:null, undefined:undefined},

transform = {
  // [(,a,[',',b,c],d] → [[a, b, c],c],  [(,a,''] → [a]
  '(': s => s.slice(1).reduce((a,b)=>[a].concat(!b?[]:b[0]==','?b.slice(1):[b])),
  // [.,a,b → [.,a,'"b"'
  '.': s => [s[0],s[1], ...s.slice(2).map(a=>`"${a}"`)]
},

getop = (s,o,i) => {
  if (typeof s != 'string' || s[0]=='"') return
  for (i=operator.length;i--;) if (o=operator[i][s]) return o
},

// code → calltree
parse = (s, i=0) => {
  const tokenize = (op, b='', n, q, c, cur=[]) => {
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
      else if (getop(op=c+s[i])||getop(op=c)) commit(b, op)
    }
  },

  // group into calltree nodes by precedence
  group = (s) => {
    if (!s.length) return ''
    let g, prec, op, i, a,b,c,x,y

    for (prec of operator) {
      for (i=0;i<s.length;) {
        [a,x,b,y,c] = s.slice(i,i+5)

        for (op in prec) {
          if (prec[op].length>1) {
            if (x===op && !getop(a) && !getop(b)) {
              // ,a,+,b, → ,[+,a,b],
              s.splice(i,3,[x,a,b])
            }
          }
          else if (getop(a)) {
            // TODO: detect postfix unary
            // ,+,-,b → ,[+,[-,b]]
            unary
          }
        }
        i++
      }
    }

    return s.length>1?s:s[0]
  },

  map=s=>{
    // TODO: take a node and flatten, if necessary
  }

  s=tokenize(s)
  return s
},

// calltree → result
evaluate = (s, ctx={}) => Array.isArray(s)
  ? (Array.isArray(s[0]) ? evaluate(s[0]) : ctx[s[0]]||getop(s[0]))(...s.slice(1).map(a=>evaluate(a,ctx)))
  : typeof s == 'string'
  ? s[0] === '"' ? s.slice(1,-1) : ctx[s]
  : s

// code → evaluator
export default s => (s = typeof s == 'string' ? parse(s) : s, ctx => evaluate(s, ctx))

