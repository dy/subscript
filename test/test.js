// Parse tests
import './parse.js'
import './expr.js'


import './justin.js'
import './jessie.js'

// Compile tests
import './compile.js'
import './stringify.js'
import './security.js'

// Feature tests
import './feature/control.js'
import './feature/regex.js'
import './feature/template.js'
import './feature/unit.js'
import './feature/jessie.js'
import './feature/async-class.js'


// Integration tests
import './subscript.js'

// Node.js only tests (bundler uses fs, perf needs stable timing)
if (typeof process !== 'undefined') {
  await import('./meta.js')
  await import('./bundle.js')
  await import('./perf.js')
}

// Error formatting demo
// import './errors-demo.js'
