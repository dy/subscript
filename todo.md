# todo

## v10

- [x] This file (todo.md) — 564 lines of done items, archive to docs/history.md if needed
- [x] test/lib/parser/* — competitor code moved to CDN (esm.sh)
- [x] test/bench/* — internal experiments, not tests
- [x] README: commented-out "Used by" section — either fill or remove
- [x] SPECIFICATION.md — formal AST spec (the hidden treasure)
- [x] Rectify project structure
- [x] Rectify even more: /parse, /compile
- [x] Migration
  - [x] Create feature/number.js (minimal: decimal only)
  - [x] Create feature/string.js (minimal: double-quote only)
  - [x] Update imports in parse/expr.js
  - [x] feature/c/number.js (hex 0x, binary 0b, octal 0o)
  - [x] feature/c/string.js (single quotes)
  - [x] feature/c/op.js (merge: bool.js && ||, bit.js & | ^ ~, shift.js << >>, assign.js compound, ternary.js ?:, true/false)
  - [x] feature/c/comment.js (move from feature/comment.js)
  - [x] feature/c/block.js (move from feature/block.js)
  - [x] feature/c/if.js (move from feature/if.js)
  - [x] feature/c/loop.js (move from feature/loop.js)
  - [x] feature/c/switch.js (move from feature/switch.js)
  - [x] feature/c/try.js (merge feature/try.js + feature/throw.js)
  - [x] feature/op.js (truly universal: + - * / % < > <= >= == != !)
  - [x] Simplified feature/number.js (decimal only)
  - [x] Simplified feature/string.js (double-quote only)
  - [x] parse/expr.js - import root features (number, string, op, group, member)
  - [x] parse/justin.js - import root + c/ + js/ expression features
  - [x] parse/jessie.js - import justin + c/block, c/if, c/loop, c/try, c/switch
  - [x] Updated test/compile/subscript.js to remove old imports
  - [x] Updated test/feature/control.js to remove old imports
  - [x] Updated test/bundle.js to test new file structure
  - [x] Updated test/parse/core.js to use @ instead of & in nary test
  - [x] Removed: literal.js, arithmetic.js, cmp.js, bool.js, bit.js, shift.js
  - [x] Removed: assign.js, ternary.js, comment.js, throw.js
  - [x] Removed: if.js, loop.js, switch.js, try.js
- [x] Reorganize features by languages
  - [x] Factor out common vs specific language features
  - [x] Implement a few unique to each language features
  - [x] Cover main common languages (know the list _JavaScript_, _C_, _Python_, _Java_, _Swift_, _Kotlin_, _Go_, _Rust_, _Nim?_, _??_):
- [x] Make jessie parse fully itself with all deps
- [x] Add util/bundle
  - [x] Make jessie eval itself
- [x] Add util/asi
- [x] Split compiler declarations
- [x] call is different from member

- [ ] Add validation logic

- [ ] All C-like compiler targets
  - [ ] GLSL target
  - [ ] C target
  - [ ] Wasm target

- [ ] (Readme slogan: bad phrasing. Distill core value and use-cases)
  - [ ] Add link to repl
- [ ] CHANGELOG.md — 9 major versions, no migration history
- [ ] Installation section before usage in README
- [ ] "Add Your Own Operator" guide — current extension examples are cryptic
- [ ] Real "Used by" with actual links if projects exist
- [x] typeof is part of jessie (many features are part of it)
- [x] ~~justin should not have custom decls: these are features~~
- [x] Switch statement — feature/switch.js
- [x] Destructuring — feature/destruct.js
- [x] Rest parameters — feature/function.js, feature/arrow.js
- [x] Getters/setters — feature/accessor.js (optimized with Symbol marker)
- [x] REPL updated with new features and jessie preset
- [ ] Remove implementation details from extension examples
- [ ] Highlight security model (blocked constructor/__proto__)
- [ ] Clarify positioning: one noun, not "parser/evaluator/microlanguage"
- [ ] Extension API is cryptic: Implementation details leak into API (prec, rassoc, cryptic signatures)
- [x] feature/loop.js, feature/block.js, feature/var.js — promoted to jessie.js
- [ ] Integrations section — either commit or delete the dreams
- [ ] "Parser/evaluator/microlanguage" — three nouns = unclear positioning
- [ ] "fast, tiny" — every library claims this
- [ ] First code example uses Math.sqrt — implies I need to pass globals. Red flag.
- [ ] No installation instructions before usage code
- [ ] The emoji badges compete for attention with no clear value hierarchy
- [ ] Separate compile / parse, since we can reuse parse

- [ ] Subscript template tag? sub`export x = () => {}`

## [ ] Integrations

  * [ ] implement via JZ https://youtu.be/awe7swqFOOw?t=778
  * [ ] js-based glsl evaluator

---

## Archive (completed work below)

* [x] store operators in precedence order
  + indicates unary, binary or ternary
  + directly map calltree nodes [op, ...args] (not reduce heuristic)
  + makes ops fns useful on its own (like dlv)
  + there are shortcuts or extensions for ||, && etc
  + makes simpler unary handling
  + same unaries/binaries ops can reside in different precedence
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
  → strategy of unwrapping brackets worked, but it's not generic operator but an exceptional cases for {, [, (
  * [x] the actual problem of a.b(c.d,e.f).g.h+1 is that ( and . has same precedence and are handled simultaneously, not in order
    . correct (non-order) grouping would be #a(#b,#c).g.h+1 → #abc.g.h+1 → #abcg+1 → #abcg1
    . then unwrap → [+,#abcg,1] → [+,[.,#abc,g,h],1] → [+,[.,[#a,#b,#c],g,h],1] → ...
    → we cannot organize single object with order of operators, these two (/. must come same time therefore
    + ok, with precedence split it seems to be possible now a ( #bc → [(, a, #bc, #de], needs unwrapping only
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
    5. Prohibit arrays/JSONs?
      + not cross-compatible - every lang has its own way defining them, but property access is same
      + expected to pass via context
      . not really good idea to mix lisp with arrays/objects
      → better provide lispy constructors like ['[]', [',',1,2,3]] or ['{}', [',',[':',a,1],[':',b,2],[':',c,3]]]
        . that gives a hint for end-catch operators, hm. like
        ? '...[...]':(a,b)=>, '...(...)':(a,b)=>, '...?...:...':(a,b)=>
          + same as in mdn https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
          - lengthy
          - impossible to approach in the same loop as regular operators. Asc creates [.,a,b,[c,args]], desc creates [[[+,a,[.,b,c]], d, .e]
* [x] take over jsep-strip performance
* [x] word operators
* [x] ~~subscript`exp`~~
  → no need for tpl tag unless fields have special meaning
* [x] ternaries: `a?b:c`, `a|name>b`, `a,b in c`, `a to b by c`,
  * [x] ‽ what if we decompose these to op groups (just postfix unaries), it's totally fine and even useful:
    + [?,a], [?a,[:b,c]], [in,[,a,b],c], [to,a,b], [to,a,[by,b,c]], [if,a,[else,b,c]]
    . for that we would need to create transform groups
    + that would enable Justin extension
    + that would allow flattening fn calls by default
* [x] ;
* [x] comments
* [x] # operators overloaded (python comments for example)
* [x] justin
* [x] infinite unaries? -+-+a
* [x] postfix unaries, `7!` (factorial), `5s` (units), `exist?`, `arrᵀ` - transpose,
  . Lisp tree doesn't make difference between unary/binary operator.
  . Seems that postfix operator === binary operator without second argument.
  - We don't have cases in pure subscript for postfix operators: a--, b++ don't make sense in evaluator.
  ? What if make 1st group - unaries prefix, 2nd - unaries postfix?
    + a way to implement unaries
    + removes arguments limitation
    + allows accessing unaries directly
    - can be complicated extension, unless we reference group immediately, not by index
    + allows faster search for unaries
* [x] . operator is not compatible with others, like a.+b.+c
  - it's neither evaluable: in handler '.':(a,b)=>a[b] b has meaning as "string", not value from context by that key
* [x] extension: Justin (+JSONs)
  ? make transforms for strings?
* [x] Bench
* [x] unary word
* [x] Optimizations
  - parser is mode-less: for each character it attempts to check every possible condition. Smart guys don't overcheck and just consume according to current mode. Eg. for s
  - [x] preparate jsep - [x] remove noise, [x] flatten, [x] lispify
    + fastest 10 times than justin
    + size is only 300 bytes more
    + supports errors better
    * [x] make generic extensions as subscript
    * [x] fold gobbling groups with gobbling arguments/properties
    * [x] make simpler identifiers consumption
    * [x] fix subscript tests for jsep stripped
    * [x] ~~simplify eval: no need for first arg cases, just op or fn~~ decided to have long evals
      + no flattening: makes precedence more clear, ops reduce-less: in js there's still binary ops
        - can be hard to organize right-assoc operators like **
        → long calls (multiple args) allow easier manual evals, frisk-compatible, fns still require args, enables shortcuts
  - ~~try handling unaries in advance~~ → direct parser solves that
    ? turn . operator to transform
      ? a.b(c.d).e.f
  . dislex version (operators split) was faster than now.
  - seems many redundant checks come from operator call at the time when we just consume a token
  . it is meaningful to track perf tests from the beginning of development
* Main slowdown reasons:
  1. Operators lookup - it must be precedence dict
  2. Unknown 20% lost at recursive algorithm: jsep-strip is faster:
    . it has direct sequences
      - streamlined sequences: doesn't seem to speed up.
    . direct props/calls
    . single-token expression shortcuts
    . flattened recursion.
      + it speeds up indeed up to 5-10%. Added hand-to-hand imlpementations.
      ! Found! Recursion just causes extra consumeOp checks (twice as much)
    ↑ Something of that makes thing faster, although less pure nor extensible (like, no {} literals).
    . Logically, gobbleExpression doesn't check every token to belong to end token, so maybe there's just less checks?
      → seems that we're going to have slower perf.
* [x] Passing array literals is a problem
  - no way to pass Array literals to calltree. Internally they're marked in literals store, so evals are guaranteed. But direct eval(['a', ['+',1,2,3]]) marks an array as evaluable.
  ? Maybe we should prohibit evaluate exports to simplify internal logic?
  → transform keeping raw literal or turn into constructors.
  → not literals anymore, but tree operators
* [x] Minifications
  * [x] ( [ . can be folded to operators, can they?...
  * [x] generalize parsing identifiers: parseFloat works on any string, things like 1.1.2 can be folded, although mb not as performant. Maybe make digits+numbers parseable as single chunks?
    * [x] 2a can be parsed as `2*a`, but likely with '' operator
      + that also allows defining either units or coefficients (units can be done as postfix too)
    * [x] Maybe create separate parse literal function
      + can detect booleans, null, undefined
      + can detect any other types of literals, like versions, units, hashes, urls, regexes etc
* [x] ~~https://github.com/gajus/liqe~~ nah
* [x] Flatten binaries: [, [, a b] c] → [, a b c]
  + many exceptions lead to flat form (args, sequence, ternaries)
  + it matches reducers
  + formulas are still meaningful this way
  + good for performance
* [x] Transforms for literals/tokens.
  → done as parsers, just implement per-token parsers
  + We need to interpolate strings `a${}b`
  + We need to generalize tokens 2a, https://..., ./a/b/c, [a,b,c], {a,b,c}, hash, /abc/ig, 1.2.0
* [x] Process sequences separately
  + Now expression loop checks for groups besides normal operators, which is op tax
  + Now commas are almost useless
  + Braces are still special case of operator
  + Comma-operator creates many problematic transforms, that can be reduced
  - It doesn't gain desired performance, still ~17-20% slower.
    + → due to excessive lookups
  - It still has problems with calls/properties - it must check if consumed operator is a group or not.
    → can be checked on expression level for redirection
  + With memoized op lookup it allows faster braces lookups (no closing braces)
  + Sequence is useful for consuming same-precedence ops as well like a + b + c ...
  - Passing precedence over sequence is tedious
    → Maybe pass groupinfo, like [operator, precedence, start, end, index]?
  - consumeGroup from previous impl is almost identical (gravitates) to consumeSequence
    - we may just address operator memo, current group collection (that simplifies lookups)
  + [.( are 3 special transforms and also they need special handling in expressions...
  + also , still makes no sense on itself, so mb they can be handled as postfixes actually
  → Ok, handled in id parser as single token, same as jsep - that reduces unnecessary declarative API
* [x] Optimizations 2
  * [x] Operator lookup can be simplified: look for small-letters first, and increase until meet none
    ? so we go until max length or until found operator loses?
      - it's faster for 1-char ops, slower for 2+ char ops
  * [x] curOp can expect itself first, unless it's not met do lookup
    + allows better node construction as well
* [x] Separating binary/unary and operators is good: +clear pertinence to eval/parse, +faster & simpler base, ...
* [x] Should consolidate binary as `parse.binary`, `parse.prefix`, `evaluate.operator`?
  + makes sense semantically
  + better association parse.literal = ...
  + reduces amount of exports
  + no plurals needed
* [x] Error cases from jsep (from source)
* [x] Improve perf formula 1 + (a | b ^ c & d) + 2.0 + -3e-3 * +4.4e4 / a.b["c"] - d.e(true)(false)
* [x] Make literals direct (passing wrapped numbers to functions isn't good)
* [x] ? Is that possible to build parser from set of test/consume functions, rather than declarative config? (see note below).
  + allows defining per-operator consumers
  + allows better tests (no need for generic operator lookups)
  + allows probablistic order of operators check
  + some operators can consume as much nodes as they need
* [x] Optimizations 3
  * [x] Think if it's worth hardcoding subscript case, opposed to generalization
    + apparently that's faster, esp if done on numbers;
    + maybe that's smaller, since generalization is not required;
    + it can take a faster routes for numbers, sequences (no global closing-bracket case);
  * [x] ~~It can be completely built on recursions, without while loops.~~
    . Take space: space = (str='') => isSpace(c=char()) ? (str+c, index++, space(str)) : ''
    → recursions are slower than loops
* [x] Move token parsers out: that would allow simplify & speed up comment, quote, interpolated string, float, even group token, and even maybe unary
* [x] Will that eventually evolve into dict of parsing tokens/arrays of tokens? We may need this dict to be passed to subparsers, eg. string interpolator may need parse.expr.
  ? maybe just make it a valid class? parser = new Parser(); parser.group(), parser.char() etc.
    + exposes internal sub-parsers
    + naturally exposes static variables
    + passes instance to custom subparsers
    + standard method
    - mb problematic minifications
  ? alternatively, a set of top-level parsers
  → Done as flat directly exported tokens
* [x] Parsers scheme usually can be generalized to just a set of tests like
  isNumber: consumeNumber
  isIdentifier: consumeIdentifier
  isUnaryGroup: consumeUnaryGroup like (a)
  isUnaryOperator: consumeUnary like +a
  isQuote: consumeString
  isComment: consumeComment
  isAnythingElse: consumeAnythingElse

  isBinaryOperator: consumeBinary like a+b, maybe even a+b+c
  isBinaryGroup: consumeBinaryGroup like a(b), maybe even a,b,c
  isTernaryStart: consumeTernary like a?b:

  . Each test is fastest as simple numbers comparison, worse - string comparison, worse - regex
  . Each consume is flow with own simpler checks
* [x] Move fragment parsers into own module
  + makes shorter & cleaner main exports, extension is possible by importing from src/
  - requires bundling
* [x] Node tests
* [x] Hardcode subscript parser for smaller size & better perf
* [x] Make parse/eval first-level
* [x] ?: operator is problematic with postfix parsers, since they expect highest precedence and a||b?c:d needs only 4.
  + also fn checkers unfortunately not as fast as desired.
  1. ‽ group/binary can be merged into a single dict: precedences come under 32, after 32 - ascii chars, denoting character to catch. This way ternary can be organized as `{?: 58}`, and groups as `(: 41`, `[: 93`.
    ? How do we detect tail-parsing?
  2. Make postfix parsing take in account precedence somehow
    ? Parse postfix after every expression group as well, not only after token
  3. Merge binary and postfix somehow: binary is also a kind of postfix extension, isn't it?
  4. ✔ We can regroup binary dict to be a set of parsers: each parser anyways checks for first character to match some condition;
    + This way we can customly map .[(
    + This way we can customly map ?:
    + This way we can customly map a+b+c+...
    + This way we can map
    + We could limit lookup by slicing precendence array, not by comparing fact of found lookup and discarding it
      → We have to store parsers as [,comma,some,every,or,xor,and,eqneq,comp,shift,sum,mult,unary,propcall]
        - that's going to be slow to call this set of functions, compared to object lookup
          + that's faster in fact than descending dict lookup:
            . we first don't search what we should not search by precedence
        + it can be easier to organize sub-search (we need to parse precedence only higher than the current one)
      ! there can be a lookup booster checker as well, eg. if code is +, then it's either binary or unary, just fast-forward
      . Seems routing is necessary
        0. ✔ lookup is through all precedences until null returned for all of them.
          + very fast method
        1. That can be done as global routing function or object `findOperator(prec,c1)()`
        2. That can be done per-precedence function `sum=x=>pass(x)?mapped:mult()`:
          - extending would imply changing prev function in chain - ridiculous
        2.1. We can pass `next` function to levels `sum=(x,next)=>pass(x)?mapped:next()`
      - Cannot use precedence constructor: it creates fn call stack for condition, besides internals are too different: either number of op chars to skip varies, or unary/non-unary case, overall not worth it
* [x] remove first char check into lookup table
* [x] ~~Try moving [(. into token?~~ nope, splitting to lookup table is better
* [x] is that possible to merge tokens with operators lookup table?
  + it seems we uniquely identify tokens by first character as well (with fallback to non-spacy UTF for ids)
  + that's faster
  + that supposedly allows merging tokens/ops loop
  + that would allow to avoid confusion of `not` operator detected as token
  + also that would shrink parse.token to a bunch of lookups
  + also space can be done via lookup as well
  - tokens lookup introduce separate rules dict, which is almost identical to tokens that we expose now, it is even technically parsed differently
  - cognitive load it adds is sort of impersonal - hard intellectual grasp, opposed to easy token meaning
  - not operator can be worked around by checking lookup table in tokens parsing as well
  + interpolated strings eval can act as operator a``, `` - not token.
* [x] ~~pass end character as expr argument~~ nope - it requires idx++, which is behind expr purpose
* [x] make group an operator, not token
* [x] token must wrap found result in an object, otherwise ignore falsish stuff - that will align method with operators, no nil
  ? How do we handle it then?
  . With strings - we return them wrapped as `"something"`. We don't return actual strings.
  . We need truish wrapper objects with correct valueOf returning undefined etc.
  . Real primitives are actually available, we can still unwrap them into tree
  ? Maybe first merge expr loop, then find out if single-point unwrapping is available
* [x] ? Separate subscript setup from core eval/parse?
  + Some languages have precedence other than JS. Subscript forces JS precedence with no way to redefine it.
  + That would compactify justin, although with some duplication. Or maybe not, if we build from subscript.
  - that leaves parse unworkable and meaningless. Minimal level thing maybe?
* [x] Test low-precedence unary, like  `-2*a^3 + -a^2`
* [x] Unknown operator test case, like <<< or >==
* [x] expr can skip end, if passed: low-hanging fruit
* [x] Make eval-only tests
* [x] Remove spaced check: word operators are exceptional and better be conditioned manually
* [x] ? externalize operator lookup descent?
  + fast op lookups are single functions, not stack of meanings: it can boost perf and shorten size
  + descent can be implemented manually
  - makes no point to host pre/postfix index then
  - it's nice to have it a separate feature
  - blocks >>> vs >> vs > vs >= detection
* [x] Eval optimizations:
  * [x] ~~calltree nodes can stash static values (as in HTM)~~
    - doesn't give much perf, but increases size - that's 1 fn call + 1 check
  * [x] node can pre-figure out what function must be used on it (done as detecting reducer)
* [x] Eval: cache static parts
* [x] string token:
  1. new String(abc)
    + shorter eval code
    + correlates with val for literals (any literal can be a wrapper)
    + natural wrapper parser as well: new Number - parses string
    - dirty tree
    - uneasy manual eval
  2. '@abc'
    + frisk-compatible
    - eval is not completely frisk-compatible, eg. [1,2,3] node is not valid in subscript
    - it's unnatural notation
  3. '"abc"', "'abc'"
    - not generic: need support for each type of token
  4. 'str:abc', 'data:abc'
    + URL schema-compatible
    + 'int:1.12', 'float:2.25', 'bool:true', 'literal:this'
  5. ? merging with literals somehow - like [value]?
    + would save space from val function
    + would allow static pre-eval
    + would let evaluators decide how to handle literals (no need for explicit unwrapping strings for `.` operator)
    + would let evaluators implement reducers logic
    + if we store literals as [value], that'd be also compatible with frisk
      - array is confusable with, say [0] or [null] - this will attempt to get these values from context
        + we can facilitate that by making sure value is not a string
      - strings as ['abc'] would be confusable with fn call
    . note that a(b,c) is ( operator with b, c, ... args (comma acts as flattener)
  6. Functional types/evaluators, like id={valueOf(){ return ctx[id] }}, lit={valueOf(){ return literal[lit] }}
    + allows to get rid of evaluator ad-hocs
    + all 5.s
    . in fact .evaluate can be a node's method, so evaluator would be trivial
    + that can be meld with 1.
    ? simply string can be meant ref to context, other tokens are all valueOfs
  7. Relegate types to cast operators, eg. `int 123` → `['int', '123']`, `['bool', 'true']`, `['', null]`
    + same as functional wrapper, but via built-in method
    + lispy logic, consistent
    ? how to differentiate statics? Anything that's not node?
    - if operator evaluators were built-in into nodes, we wouldn't have to keep cast type evaluators at all.
  8. ✔ Direct evaluators instead of nodes
    + merges config into single definition
    . types of evaluators: binary op, prop access, fn call, group, array, object, literal, context variable
      → there are common types of evaluators, like, binary, unary, multi, but can be custom
    . We keep ctx access as direct strings, allowing defining prop getter evaluator
    + We save space on node operator definitions
    ! fn can have with valueOf, calling itself.
    ? How do we detect static parts? Mark parsed tokens?
      + via parse.literals returning evaluator with 0 args!
    ? How do we define function call and id?
      . As a couple of parsers, instead of evaluators?
      . direct fn reducer is extra call, can slow down evaluation. Defining token-based calls would add some code, but make evals faster
      . a(b,c) operator is the main blocker against non-reducer binaries. If we somehow managed to handle `,` via binaries, we'd reduce flat-reducers code, even static optimizers would flatten (+faster +shorter)
      . `.` and `in` operators treat args as literals, not ids. Is there a way to parse them as literals?
      . it should not be a hack, it should be conceptually right
      . seems that operator decides not only how to evaluate operands, but also what semantic they have. Ie. they're responsible for what meaning token parts have.
      . or either - `a.b` is not an operator but a kind of identifier access.
        - still `a,b in c` is special construct. Same as `let a,b` or `a of b`
        → can be solved via checking in id if ctx is passed and returning self otherwise
      . v6 is less flexible, in sense that there's no easy way to redefine parsing
      → ok, passing map is the most flexible and generic:
        + allows redefining calc which is -1 stack call
        + allows flexible parser
        - although it adds 20 commas and redundant parsing - we usually deal with operators on nexpressions - mb just a case of evaluator?
* [x] inside-expression skip can be combined into operator, if we're able to indicate what operator we're defining
  ? by precedence we can detect what type of function is passed: unary, binary or postfix
  - no: idx+=l 3 times is less than condition to detect it from outside
  + yes: we do from=idx, idx=from, and also it outpays on extensions
* [x] test `a ++` postfix spacing
* [x] ~~try to get rid of skip, code, char from configurators: parse literals, tokens somehow differently~~
  - no: we better implement custom parsers instead
* [x] ~~flat into single subscript.js file, unminified: saving redundant exports and conventions~~
  - no: that's the opposite, makes redundant exports for internal values - how would we extend justin otherwise?
* [x] Sequences in expr vs `,` as reducer
  - modifying engine is verbose and slow, compared to direct lookups...
  + fake operators isn't good also
  - seq creates an args array - we have to reduce it for eval anyways, which is natural via operator
  - operator doesn't need modified code() call
  → utilize custom parsers, where args are needed.
* [x] ~~Declarable multiarg operator like (a,...b)=>x vs separator ['(',',',')'] vs manual sequences handling~~
  - separator doesn't account for `a,b,c in d`
  - (...a,b)=>x is neither possible
  - `[',','in']` is impossible - end operator is 1-char now
  → no: just use custom parsers, they occupy less space in total than unnecessary generalizations
* [x] ~~extend end operator to multiple characters?~~
  → no: end operator is a custom parser case, not generalized
* [x] make ternaries support as `['?',':'],(a,b,c)=>{}`
  → no: make custom parser
* [x] Radical nanoscript?
  - [x] ~~remove descent;~~ no: descent is useful for standard operators and overloading
  - [x] binaries-only defs;
  - [x] eval binaries only;
  - [x] no char, ~~no code, no err~~; → err and code are heavily needed, char is rare in code, can be substr instead
  - [x] ~~space via skip;~~ no: too slow
  - [x] ~~no word operators;~~ no: too easy to do and useful to have
* [x] ~~Make mapper configurable:~~
  * [x] binaries-only vs flat nodes must be a feature of configurator, not built-in.
    - for fn arguments / arrays we have to parse `,` as flat sequence, unless we provide a special reducer in `(` parser - that doesn't save that much space
  * [x] As well as word operators. → trivially solved as custom mapper with next-char check
  * [x] As well as reducer in evaluator.
  → not needed anymore as direct evals supercede v5 scheme
* [x] ~~reorganize as conditional eval getting, instead of props in fn~~ can be partially done by passing custom precedence, but not sustainable
* [x] justin, all tests, publish v6
* [x] Make better error explanations
* [x] remove tagged literal, since it doesn't make much sense without caching by callsite. That can easily be implemented user-side.
* [x] collect ids: needed for element-params
* [x] simpler way to extend: ideally we should be able to extend subscript without internals for:
  . strings
  . a?.b
  * [x] somewhat possible by passing ids as arguments
  → Just expose direct parser. Requiring it from `/src` is unreliable, but extending is needed
* [x] make `operator`, `token` more external methods with plain API
* [x] numbers must not be part of core:
  + they are valid ids
  + different config may want parse differently, like versions `1.2.3`
  + different lang has different number capabilities
* [x] identifier parser can be configurable:
  + we may want to collect all used ids → can be done via AST
  + we may want it to return different target (function, string, etc) → can be done via separate eval / AST
  + or make `a.b.c` identifiers, not operators.
* [x] don't collect arguments? it slows down parsing and can be done as separate analyzing routine in target DSL.
  * maybe we just need better interop instead (see below)
  + since ids can be collected externally now, it's better to outsource that indeed, to keep point of performance/size.
  ~ same time, since subscript is not just a thing in itself, it would be useful to expose ast.

* [x] Should we retain `subscript.eval` and `subscript.parse` for different purpose uses?
  * Alternatively, we can come up with `node` constructor that can either create an eval function or generate AST
  * Or we can still stuff ast into eval, like .id, .of etc.
  * Wasm is still faster for parsing and evaluating. Keeping ast is useful.
  + returning AST from parse method is both fast and useful, rather than single-purpose eval, which can be splitted
  → eval, as well as compile, map, JSONify, ESify, WASM-compile etc. - are different targets indeed.

* [x] Would be nice to provide actual analyzable tree, not just eval function.
  + ast enables easier access to underlying tokens (no need to fake id function), no need to store .of, .id etc.
    + that would solve collecting arguments case
  + that would allow different targets by user demand
  + ast makes many custom operators direct ones, like . or
  + ast is possible to eval in wasm, since it's declaratively defined
  + that would allow swizzles, pre-eval and various node optimizations like a++ → a+=1, a,b = 1 → a=1, b=1
  - stuffing tree into subscript seems to be dissolving main point: terse, fast expressions.
    → parse is faster and even smaller, eval is on par via separate evaluate target

* [x] AST format
  * It can be strictly binary or with multiple args. Multiargs case makes more sense (?:, a(b,c,d), [a,b,c,d], a;b;c;d)
    + multiargs allow SIMD and other optimizations, it better reflect actual execution and doesn't enforce redundant ordering
    + AST should be able to validly codegenerated back, therefore redundant ordering imposes redundant parens
      * Precedences belong to codegenerator, not to parser, to match against.
    + enables simd
  * AST can reflect either: visual syntactic structure (like exact parens) OR semantic order of execution.
  * AST can not depend on languages and just reflect order of commands execution, can be converted to any language.
    ~ may be challending if target lang has different precedences → precedences must be defined by target codegenerator
  * Parens operator may have semantic sense as either grouping or destructuring
  * Can be converted to xml as `<mul><a/><b/><c/></mul>`
  → safest is source fragments ordered as nested arrays indicating order of evaluation.

* [x] Number, primitives parsing: is that part of evaluator or parser? What about mapping/simplifying nodes?
  + we organically may have `[value]` syntax for primitives/literals
    - there are 0 operand operators: `;;;`, `a,,,b` taking that signature
  + some parsing literals can be complicated, like \` or `1.2e+3` - need to be detected parse-time;
    + postponing them is extra _parse_ work
    * There are many non-standard number signatures: 0x00, 0b00, 00017, 0123n, 1.23e+5, 1_100_200
    - these literals can be parsed from AST also via custom mappers `['.', '1', '2e']`
    ~ that can be parsed specifically, but AST should be very safe
  - Numbers are in eg. XML - we'd still store untyped strings there
  - Type detection therefore can be done on stage of interpreter (eg. XML).
    * so that is sort-of preparing arguments for eval...
  - optimization mapping can be done on level of evaluator (pre-eval), not before - we need reducers to do that
  - null, undefined, false jeopardizes expr eval: need to be strings
  → As a gift for God it should be lightweight, generic and minimal.
    → It should be JSON-compatible, therefore types should be abstracted as much as possible (arrays + strings).
      ~ although json allows booleans and numbers and even null
    → we don't need mappers layer: parser already includes mapping, no need for any extra, it should create calltree.
    → it's safest to convert initial string to ordered substrings, without particular type detection.
    → **Evaluating value (converting from stirng to value) is parse of evaluator**
      ~ same time on parsing level we can point to a type function to initially parse - it will save time on reparsing in eval.

* [x] Mapping layer?
  + map various numeric constructs
  + map swizzles from sonr
  - nah, mapping is part of parsing. Just handle whatever structures needed in parse.

* [x] Generalize operator registering

* [x] Make less cryptic
  * [x] Provide explicit `binary`, `unary`, `sequence` helpers
  * [x] Make main clean single entry, without commonscript setup. DSLs may not need shifts or binary by default
  * [x] Make explicit `lookup.id`, `lookup.space` - parsing should not be cryptic, it should be apparent
  * [x] Display better error message with context and underline

* [x] Sometimes nary returns last element as null, other times as undefined. Find out why.

* [x] ~~Make able to parse sequence of identifiers: s-expressions or html may allow that.~~ nah, subscript is not for that

* [?] ~~remove `a.1` and `a.true` from subscript~~
* [x] make `a?.valueOf()` context work
* [x] ~~make default difference of `a()` as `['()', 'a']` like in lino, rather then here~~
* [x] streamline samples (at price of larger codebase - that's fine)

* [x] ~~Hide skip, expr, compile as args for defining tokens functions?~~ -> nah, passing as args is messy
  + shorter exports
  + easier extending dialects - no need to import parse/eval internals

* [x] Modularize, make pluggable groups
  + standardizes base for various languages

* [x] ~~Recognize false, 0 and '' as results of successfully parsed expressions.~~ -> nah, too much trouble with checks for undefined, null, false, 0, '' as primitives
  * [x] ~~Make `[,'path']` for prop access, and `'value'` a direct primitive~~ -> can't easily parse direct primitives without wrapping

* [x] ~~Flip increments `[+=, a, 1]` for `++a`, and `[++, a]` for `a++`~~ -> nah, likely that's harder than ++a-1 (dealing with object cases)
* [x] ~~Untangle prefix/postfix order~~ not existent anymore
* [x] See if we can get rid of `set` -> yes, it makes code smaller & simpler
* [x] add assign operators
* [x] consolidate obj access cases in one function: +assign, +inc/dec, +=/-=, +call, ?. reuse similar chunk
* [x] Make literals via `[,val]` (no need for empty string)


## Backlog

* [x] ~~Better interop. Maybe we're too narrow atm. Practice shows some syntax info is missing, like collecting ids etc.~~ -> not clear what's that
  * [x] ~~different targets: lispy calltree, wasm binaries, regular ast, transform to wat, unswizzle~~
  * [x] ~~collecting ids via tree traversal~~ -> impl in dependent
  * [x] ~~sonr transforms like `a,b,c = d,e,f` → `a=d,b=e,c=f`~~ -> do client transform
  * [x] ~~more direct API: prefix operator, id - may not require low-level extension~~
    → that belongs to custom langs, not core
* [x] Protect eval from accessing global
* [x] FIXMEs in code
* [x] Better error cases: unclosed group etc. Never show internal JS errors.

* [x] `(a ? ^b; 123)` error points to `(a ┃? ^-a; 123)` instead of `(a ? ┃^-a; 123)`

* [x] ~~complex groups detector: a*x + b*y + c~~ - no use cases
* [x] ~~compile groups/complex groups to wasm: a*x + b*y + c~~ - no use cases

* [x] split loops feature from coditions
* [x] ~~ASI injection~~ -> belong to jz
* [x] optimize control

* [x] add integration links to readme


## [x] Demo

* [x] REPL
* [x] language building tool: create own language with a set of features
  * [x] Make operator groups, importable; build subscript by including op groups.

## Extra features

* [x] string interpolation `` `a ${x} b` `` → feature/template.js
* [x] regexes `/abc/gi` → feature/regex.js (disambiguates from division by context)
* [x] units `5s`, `5rem` → feature/unit.js (hybrid: wraps number handlers)

* ~~Keyed arrays `[a:1, b:2, c:3]`~~ — just use object syntax `{a:1}`
* ~~`7!` factorial~~ — math-heavy DSL only, trivial postfix via `token('!', ...)`
* ~~`arrᵀ` transpose~~ — Unicode gimmick, user defines via `token('ᵀ', ...)`
* ~~`int 5` typecast~~ — prefix word op already supported, user defines
* ~~`$a` parameter expansion~~ — shell DSL, trivial `token('$', ...)`
* ~~`1 to 10 by 2`~~ — range syntax too domain-specific
* ~~`a if b else c`~~ — Python ternary, subscript has `?:`
* ~~`a, b in c`~~ — already in justin as `in` operator
* ~~`a.xyz` swizzles~~ — graphics DSL, needs custom `.` handler
* ~~vector operators~~ — too specialized, userland
* ~~set operators `∪ ∩ ∈`~~ — userland
* ~~polynomial operators~~ — academic niche
* ~~versions `1.2.3`~~ — custom number parser, userland
* ~~hashes, urls~~ — string literals, parse in userland
* ~~`2a` as `2*a`~~ — implicit multiply breaks identifier rules
