import test, {is, any} from '../lib/test.js'
import subscript, {parse, evaluate} from '../subscript.js'

test.skip('atoms: numbers', function() {
    is(evaluate([1]), [1]);
    // is(evaluate(1), [1]);
});
test.skip('atoms: lists', function() {
    is(evaluate([1, 2]), [1, 2]);
    // is(evaluate(['[',1, 2]), [1, 2]);
});
test.skip('atoms: nested lists', function() {
    is(evaluate([1, 2, [3, 4]]), [1, 2, [3, 4]]);
});
test.skip('atoms: strings', function() {
    // is(evaluate(['@foo']), 'foo'); // NOTE: this is wrong extension
    is(evaluate('@foo'), 'foo');
});


test('math: can add', function() {
    is(evaluate(['+', 1, 1]), 2);
});
test('math: can subtract', function() {
    is(evaluate(['-', 1, 1]), 0);
    is(evaluate(['-', 3, 1]), 2);
    is(evaluate(['-', 3, 6]), -3);
});
test('math: can multiply', function() {
    is(evaluate(['*', 2, 1]), 2);
    is(evaluate(['*', 2, 2]), 4);
});
test('math: can divide', function() {
    is(evaluate(['/', 2, 1]), 2);
    is(evaluate(['/', 2, 2]), 1);
    is(evaluate(['/', 1, 2]), 0.5);
});


test('nested: can add', function() {
    is(evaluate(['+', ['+', 1, 1], 1]), 3);
});
test('nested: can subtract', function() {
    is(evaluate(['+', ['-', 1, 1], 1]), 1);
});


test('identity: first', function() {
    is(evaluate(['first', 2, 1],{first:a=>a}), 2);
});
test('identity: rest', function() {
    is(evaluate(['rest', 2, 1, 2, 3],{rest:(...args)=>args.slice(1)}), [1, 2, 3]);
});

// test('let', function() {
//     test('basic assign', function() {
//         expect(frisk(['let', [['foo', 1]], ['foo']])).to.eql([1]);
//         expect(frisk(['let', [['foo', 1], ['bar', 2]], 'bar'])).to.eql(2);
//     });
//     test('operations on let', function() {
//         expect(frisk(['let', [['foo', 1], ['bar', 2]], ['+', 'foo', 'bar']])).to.eql(3);
//     });
// });

// test('lambda: identity lambda', function() {
//     is(subscript([['lambda', ['x'], ['x']], 1]), [1]);
// });
// test('lambda: list lambda', function() {
//     is(subscript([['lambda', ['x'], ['x', 'x']], 1]), [1, 1]);
// });
// test('lambda: math lambda', function() {
//     is(subscript([['lambda', ['x'], ['+', 'x', 'x']], 1]), 2);
//     is(subscript([['lambda', ['x'], ['*', 'x', 'x']], [2]]), 4);
// });
