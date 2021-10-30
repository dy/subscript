export const operator = [
  {'(':a=>a},
  {
    '(':(...a)=>a(...args),
    '[':(...a)=>a.reduce((a,b)=>a?a[b]:a),
    '.':(...a)=>a.reduce((a,b)=>a?a[b]:a)
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
    '%':(...a)=>a.reduce((a,b)=>a%b),
    '/':(...a)=>a.reduce((a,b)=>a/b),
    '*':(...a)=>a.reduce((a,b)=>a*b),
  },
  {
    '+':(...a)=>a.reduce((a,b)=>a+b),
    '-':(...a)=>a.reduce((a,b)=>a-b),
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
  {'&&':(...a)=>a.every(Boolean)},
  {'||':(...a)=>a.some(Boolean)},
  {',':(...a)=>a[a.length-1]},
],

literal = {true:true, false:false, null:null, undefined:undefined},
block = {'(':')','[':']'},
quote = {'"':'"'},

transform = {
  // [(,a,[',',b,c],d] → [[a, b, c],c],  [(,a,''] → [a]
  '(': s => s.slice(1).reduce((a,b)=>[a].concat(!b?[]:b[0]==','?b.slice(1):[b])),
  // [.,a,b → [.,a,'"b"'
  '.': s => [s[0],s[1], ...s.slice(2).map(a=>`"${a}"`)]
},

getop = (s,o,i) => {
  if (!s || typeof s != 'string' || s[0]=='"') return
  for (i=operator.length;i--;) if (o=operator[i][s]) return o
},

isnode = Array.isArray,

// code → calltree
parse = (s, i=0) => {
  const tokenize = (end, op, buf='', n, q, c, b, cur=[]) => {
    const commit = (v, op) => {
      if (v) cur.push(n ? parseFloat(v) : v in literal ? literal[v] : v)
      if (op) cur.push(op)
      n=buf=c=''
    }

    // FIXME: maybe commit operators as functions, not as string tokens?
    for (; i<=s.length; buf+=c) {
      c = s[i++]
      if (q && c==q) q=''
      else if (n && (c=='e'||c=='E')) c+=s[i++]
      else if (c==' '||c=='\r'||c=='\n'||c=='\t') c=''
      else if (quote[c]) q=c
      else if (!buf && c>='0' && c<='9' || c=='.' && s[i]>='0' && s[i]<='9') n=1
      else if (b=block[c]) commit(buf, c), commit(tokenize(b))
      else if (c==end) return commit(buf), group(cur)
      else if (getop(op=c+s[i])||getop(op=c)) commit(buf, op)
    }
  },

  // group into calltree nodes by precedence
  group = (s) => {
    if (!s.length) return ''
    console.group(s)
    let g, prec, op, i, a,b

    // FIXME: we have to find a moment when group is finished, to apply transform
    // that was possible with commit, hard now
    for (prec of operator) {
      console.log(prec)
      for (i=-1;i<s.length;) {
        a=s[i],op=s[i+1],b=s[i+2]
        if (typeof op === 'string' && prec[op]) {
          if (!getop(b)) {
            if (~i&&!getop(a)) { // binary: a+b
              console.log('binary',a,op,b)
              if (isnode(a) && a[0]==op && a.length>2) a.push(b), s.splice(i+1,2) // ,[+,a,b],+,c → ,[+,a,b]
              else s.splice(i,3,g=[op,a,b]) // ,a,+,b, → ,[+,a,b],
            }
            else { // unary prefix: +b, -+b
              // FIXME: do we need to check for unary-only operator, or any binary can be unary as well?
              console.log('unary', op)
              s.splice(i+1,2,g=[op,b]) // _,-,b → _,[-,b]
            }
            // TODO: detect postfix unary
          } else i++ // FIXME: here - if g - apply transform to it
        } else i++
      }
    }
    console.groupEnd()
    return s.length>1?s:s[0]
  },

  map=s=>{
    // TODO: take a node and flatten, if necessary
  }

  s=tokenize()
  return s
},

// calltree → result
evaluate = (s, ctx={}) => isnode(s)
  ? (isnode(s[0]) ? evaluate(s[0]) : ctx[s[0]]||getop(s[0]))(...s.slice(1).map(a=>evaluate(a,ctx)))
  : typeof s == 'string'
  ? s[0] === '"' ? s.slice(1,-1) : ctx[s]
  : s

// code → evaluator
export default s => (s = typeof s == 'string' ? parse(s) : s, ctx => evaluate(s, ctx))

