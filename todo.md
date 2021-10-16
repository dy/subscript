# todo

* [ ] ternary
* [ ] eval JSON, array objects
* [ ] ;
* [ ] subscript`exp`
* [x] infinite unaries
* [ ] #,: operator overloaded
* [ ] word operators
* [ ] . operator is not compatible with others, like a.+b.+c
  - it's neither evaluable: actual handler '.':(a,b)=>a[b] needs to get `b` from context, not code, unless we patch context, which is bad
