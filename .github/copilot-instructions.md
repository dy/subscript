Avoid writing in `lookup`, use token instead.
Avoid ad-hocs - that signals inconsistency of design.
`/features` represent generic language features, not only JS: avoid js-specific checks.
For features you implement, please add tests, update SPECIFICATION.md and README.md if relevant, as well as REPL and other relevant files. Make sure tests pass. Make sure it doesn't degrade performance or bloats the code.
Make sure API and feature code is intuitive and user-friendly: prefer `unary`/`binary`/`nary`/`group`/`token` calls in the right order ( eg. first `|`, then `||`, then `||=` ) rather than low-level parsing. Normally feature should not use `cur`, `idx` features of parser and use `skip` instead.
The project is planned to be built with jz - simple javascript subset compiling to wasm, so don use complex structures like Proxy, classes etc.
By introducing a change, think how would that scale to various dialects and compile targets.
