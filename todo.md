# todo

* [x] think about flatten groups: a["b"]["c"] → a.#0.#1, a(b,c)(d,e) → a ( #bc ( #de
  + that allows correct precedence detection, eg. a.#0.#1(#2 can be split as [(, [., a, #0, #1], #2]
  + that allows overloading these operators by user
  ~ ( operator implies [(, a, args] === [a, ...args]
  + that allows removing .\w shadowing ↑
  ~ maybe problematic to separate a[b] from just [b], a(b,c) from just (b,c)
  . There's a problem a.b(c).d → a.#b(c.d → [(, [., a, b], [., c, d]], but must be [.,[[.,a,b],c] d]
    1. maybe we don't need to take .,( as operators. Just use dotprop after.
      - not clear how a.b(c).d looks: should ['.', ['a.b', c], 'd'], but how?
    2. make () a splitting operator, mb end-bracket
      - any splitting attempt creates structure either [call, [.,a,b], c, [.,d,e]] or [[.,a],[]]
  . Ok, now done as . ad-hoc
  * [ ] the actual problem of a.b(c.d,e.f).g.h+1 is that ( and . has same precedence and are handled simultaneously, not in order
    . correct (non-order) grouping would be #a(#b,#c).g.h+1 → #abc.g.h+1 → #abcg+1 → #abcg1
    . then unwrap → [+,#abcg,1] → [+,[.,#abc,g,h],1] → [+,[.,[#a,#b,#c],g,h],1] → ...
    → we cannot organize single object with order of operators, these two (/. must come same time therefore
  + ok, with special split it seems to be possible now a ( #bc → [(, a, #bc, #de], needs unwrapping only
* [x] ~~eval JSON, array objects~~ it's incompatible non-lispy syntax
  . `[`,`{`,`:` are not operators, they're built-in.
  . parser must return ready-object/array, not lispy json
  ? Array vs fn call
    1. `Array → [['a','b','c']], call → ['a', 'b', 'c']` (frisk)
      + escape any value by just [{}], [[]], [Date] ...
      - [[a,1],2] → a(1)(2), therefore [[a,1]] → a(1)()
    2. `Array → ['list', 'a', 'b', 'c'], call → ['a', 'b', 'c']` (lisp)
      + → list(a,b,c)
      - list can be external function that we supercede
    2.1 `['Array', 'a', 'b', 'c']`
      + → Array(a,b,c)
        + lucky match w/o new operator
      - `[1,2,3] → ['Array',[',',1,,2,3]]`, which is redundant
      2.1.1 ★ `[Array, 'a', 'b', 'c']`
        + since our notation implies fn call, and first arg is fn name, operator or token to call, then we just call that token
    2.2 `['...', 'a', 'b', 'c']`
      + unary operator generates list anyways
      - can be super confusing with real ... operator, like `...[a,b,c] → ['...',['...', a,b,c]]`
    2.3 `['[', 1, 2, 3]`
      + keeps reference to operator
      + `[` as prop access is transfused into `.`
      - still makes nested ',' - suppose comma should not create separate group `[',', a, b, c]` but should instead just push arguments to current
    3. `Array → [,'a','b','c']`, call → ['a', 'b', 'c']
      - undefined(a,b,c)
    4. `Array → ['a', 'b', 'c'], call → ['a', 'b', 'c'] if 'a' is a function` (frisk)
    5. ✔ Prohibit arrays/JSONs?
      + not cross-compatible - every lang has its own way defining them, but property access is same
      + expected to pass via context
      . not really good idea to mix lisp with arrays/objects
      → better provide lispy constructors like ['[]', [',',1,2,3]] or ['{}', [',',[':',a,1],[':',b,2],[':',c,3]]]
        . that gives a hint for end-catch operators, hm. like
        ? '...[...]':(a,b)=>, '...(...)':(a,b)=>, '...?...:...':(a,b)=>
          + same as in mdn https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
          - lengthy
          - impossible to approach in the same loop as regular operators. Asc creates [.,a,b,[c,args]], desc creates [[[+,a,[.,b,c]], d, .e]
* [ ] word operators
* [ ] subscript`exp`
* [ ] ternaries: `a?b:c`, `a|name>b`, `a,b in c`
* [ ]
* [ ] ;
* [ ] comments
* [ ] #,: operators overloaded (python comments for example)
* [x] infinite unaries
* [x] . operator is not compatible with others, like a.+b.+c
  - it's neither evaluable: in handler '.':(a,b)=>a[b] b has meaning as "string", not value from context by that key
* [ ] extension examples: Justin (+JSONs)
  * [ ] !keyed arrays? [a:1, b:2, c:3]
