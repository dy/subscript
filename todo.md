# todo

* [ ] eval JSON, array objects
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
      2.1.1 ✔ `[Array, 'a', 'b', 'c']`
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
* [ ] word operators
* [ ] subscript`exp`
* [ ] ternary
* [ ] ;
* [ ] comments
* [ ] !keyed arrays? [a:1, b:2, c:3]
* [ ] #,: operators overloaded (python comments for example)
* [x] infinite unaries
* [x] . operator is not compatible with others, like a.+b.+c
  - it's neither evaluable: in handler '.':(a,b)=>a[b] b has meaning as "string", not value from context by that key
