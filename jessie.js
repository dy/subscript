// Jessie: Safe JavaScript subset for mobile code
// Based on https://github.com/endojs/Jessie
//
// Jessie = Justin (expressions) + statements + declarations
// 
// Note: This is the parser/evaluator surface. For full Jessie security,
// you need harden() and SES (Secure EcmaScript) runtime.

import subscript from './justin.js'

// Statement features
import './feature/block.js'
import './feature/var.js'
import './feature/if.js'
import './feature/loop.js'

export default subscript
export * from './justin.js'
