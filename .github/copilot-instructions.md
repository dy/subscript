Avoid writing to `lookup`, use token instead.
Avoid ad-hocs - that signals inconsistency of design. High-level API is for a reason, we need to use it and if it doesn't fit, we need to improve it.
`/features` represent generic language features, not only JS: avoid js-specific checks.
AST should be faithful to source tokens - don't normalize or assume C-like semantics. If a language has `elif`/`elsif` tokens, preserve them in AST rather than converting to nested `else if`. Parse what's written, don't invent structure.
For features you implement or any changes, if relevant please add tests, update spec.md, docs.md and README.md, as well as REPL and other relevant files. Make sure tests pass.
Make sure API and feature code is intuitive and user-friendly: prefer `unary`/`binary`/`nary`/`group`/`token` calls in the right order ( eg. first `|`, then `||`, then `||=` ) rather than low-level parsing. Eg. feature should not use `cur`, `idx` and use `skip` instead.
The project is planned to be built with jz - simple javascript subset compiling to wasm, so don't use complex structures like Proxy, classes etc.
By introducing a change, think how would that scale to various dialects and compile targets. Also make sure it doesn't compromise performance and doesn't bloat the code. Justin must be faster than jsep.
By writing parser feature, aim for raw tree shape parsed with minimal code rather than edge cases validation.
