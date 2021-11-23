# todo

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
* [ ] ;
* [ ] comments
* [ ] # operators overloaded (python comments for example)
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
* [ ] ideas snippets
  * [ ] !keyed arrays? [a:1, b:2, c:3]
* [x] . operator is not compatible with others, like a.+b.+c
  - it's neither evaluable: in handler '.':(a,b)=>a[b] b has meaning as "string", not value from context by that key
* [x] extension: Justin (+JSONs)
* [ ] string interpolation ` ${} 1 ${} `
  ? make transforms for strings?
* [x] Bench
* [x] unary word
* [ ] Demo
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
* [ ] calltree nodes could stash static values (as in HTM)
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
* [ ] Test low-precedence unary, like  `-2*a^3 + -a^2`
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
* [ ] Error cases from jsep (from source)
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
* [ ] Make eval-only tests
* [x] Hardcode subscript parser for smaller size & better perf
* [x] Make parse/eval first-level
* [ ] Provide parser examples as chunks
* [ ] ?: operator is problematic with postfix parsers, since they expect highest precedence and a||b?c:d needs only 4.
  + also fn checkers unfortunately not as fast as desired.
  1. ‽ group/binary can be merged into a single dict: precedences come under 32, after 32 - ascii chars, denoting character to catch. This way ternary can be organized as `{?: 58}`, and groups as `(: 41`, `[: 93`.
    ? How do we detect tail-parsing?
  2. Make postfix parsing take in account precedence somehow
    ? Parse postfix after every expression group as well, not only after token
  3. Merge binary and postfix somehow: binary is also a kind of postfix extension, isn't it?
  4. We can regroup binary dict to be a set of parsers: each parser anyways checks for first character to match some condition;
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

