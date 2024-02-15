/**
 * Subscript dialect includes common operators / primitives for all languages
 */
import './feature/number.js'
import './feature/string.js'
import './feature/call.js'
import './feature/access.js'
import './feature/group.js'
import './feature/prefix.js'
import './feature/inc.js'
import './feature/mult.js'
import './feature/add.js'
import './feature/bitwise.js'
import './feature/compare.js'
import './feature/logic.js'
import './feature/assign.js'

export * from './src/parse.js'
export * from './src/compile.js'
export * from './src/index.js'
export { default } from './src/index.js'
