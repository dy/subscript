# todo

* [ ] eval JSON, array objects
  . `[`,`{`,`:` are not operators, they're built-in.
  . parser must return ready-object/array, not lispy json
  ? Array vs fn call
    1. `Array → [['a','b','c']], call → ['a', 'b', 'c']` (frisk)
      + escape any value by just [{}], [[]], [Date] ...
    2. `Array → ['list', 'a', 'b', 'c'], call → ['a', 'b', 'c']` (lisp)
    3. `Array → [,'a','b','c']`, call → ['a', 'b', 'c']
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
