// Jessie: Practical JS subset — Justin + statements
// Inspired by https://github.com/endojs/Jessie
//
// Not a strict Jessie reimplementation. Keeps useful features (like `in`),
// allows flexible syntax (naked if-arms). Missing features can be added
// via feature/*.js modules if needed.

import subscript from './justin.js'

// Statement features
import './feature/block.js'
import './feature/var.js'
import './feature/if.js'
import './feature/loop.js'

export default subscript
export * from './justin.js'
