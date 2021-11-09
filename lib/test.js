const GREEN = '\u001b[32m', RED = '\u001b[31m', YELLOW = '\u001b[33m', RESET = '\u001b[0m', CYAN = '\u001b[36m', GRAY = '\u001b[30m'
const isNode = typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]'

let assertIndex = 0
let index = 1
let passed = 0
let failed = 0
let skipped = 0
let only = 0
let current = null
export {current}

let start
let queue = new Promise(resolve => start = resolve)

export default function test(name, run) {
  if (!run) return test.todo(name)
  return createTest({ name, run })
}
test.todo = function (name, run) {
  return createTest({ name, run, todo: true, tag: 'todo' })
}
test.skip = function (name, run) {
  return createTest({ name, run, skip: true, tag: 'skip' })
}
test.only = function (name, run) {
  only++
  return createTest({ name, run, only: true, tag: 'only' })
}
test.demo = function (name, run) {
  return createTest({ name, run, demo: true, tag: 'demo' })
}
test.node = function (name, run) {
  return createTest({ name, run, skip: !isNode, tag: 'node' })
}
test.browser = function (name, run) {
  return createTest({ name, run, skip: isNode, tag: 'browser' })
}

function createTest(test) {
  test.index = index++

  if (test.skip || test.todo) {
    queue = queue.then(() => {
      skipped++
      if (only && !test.only) return test
      isNode ?
        console.log(`${CYAN}» ${test.name}${test.tag ? ` (${test.tag})` : ''}${RESET}`) :
        console.log(`%c${test.name} ${test.todo ? '🚧' : '≫'}` + (test.tag ? ` (${test.tag})` : ''), 'color: #dadada')
      return test
    })
  }

  else {
    test = Object.assign({
      assertion: [],
      skip: false,
      todo: false,
      only: false,
      demo: false,
      pass(arg) {
        if (typeof arg === 'string') return isNode ?
          console.log(`${GREEN}(pass) ${arg}${RESET}`) :
          console.log(`%c(pass) ${arg}`, 'color: #229944')

        let {operator: op, message: msg} = arg;

        assertIndex++
        isNode ?
          console.log(`${GREEN}√ ${assertIndex} ${op && `(${op})`} — ${msg}${RESET}`) :
          console.log(`%c✔ ${assertIndex} ${op && `(${op})`} — ${msg}`, 'color: #229944')
        // if (!this.demo) {
        test.assertion.push({ idx: assertIndex, msg })
        passed += 1
        // }
      },
      fail(arg) {
        assertIndex++
        // FIXME: this syntax is due to chrome not always able to grasp the stack trace from source maps
        // console.error(RED + arg.stack, RESET)
        if (typeof arg === 'string') return console.error(arg)

        // when error is not assertion
        else if (arg.name !== 'Assertion') return console.error(arg)

        let {operator: op, message: msg, ...info} = arg;

        isNode ? (
          console.log(`${RED}× ${assertIndex} — ${msg}`),
          (info?.actual ?? info?.expects ?? info?.expected) && (
            console.info(`actual:${RESET}`, typeof info.actual === 'string' ? JSON.stringify(info.actual) : info.actual, RED),
            console.info(`expects:${RESET}`, typeof (info.expects ?? info.expected) === 'string' ? JSON.stringify(info.expects ?? info.expected) : (info.expects ?? info.expected), RED),
            console.error(new Error, RESET)
          )
        ) :
          info ? console.assert(false, `${assertIndex} — ${msg}${RESET}`, info) :
            console.assert(false, `${assertIndex} — ${msg}${RESET}`)
        // if (!this.demo) {
        test.assertion.push({ idx: assertIndex, msg, info, error: new Error() })
        // failed += 1
        // }
      }
    }, test)

    // simple back-compatibility
    test.pass.pass = test.pass, test.pass.fail = test.fail

    queue = queue.then(async (prev) => {
      if (only && !test.only) { skipped++; return test }

      isNode ?
        console.log(`${RESET}${prev && (prev.skip || prev.todo) ? '\n' : ''}► ${test.name}${test.tag ? ` (${test.tag})` : ''}`) :
        console.group(test.name + (test.tag ? ` (${test.tag})` : ''))

      let result
      try {
        current = test
        result = await test.run(test.pass, test.fail)
        // let all planned errors to log
        await new Promise(r => setTimeout(r))
      }
      catch (e) {
        test.fail(e)
        if (!test.demo) failed += 1
      }
      finally {
        current = null
        if (!isNode) console.groupEnd(); else console.log()
      }

      return test
    })
  }
}

// tests called via import() cause network delay, hopefully 100ms is ok
// TODO: do run? with silent=false flag?
Promise.all([
  new Promise(resolve => (typeof setImmediate !== 'undefined' ? setImmediate : requestIdleCallback)(resolve)),
  new Promise(resolve => setTimeout(resolve, 100))
]).then(async () => {
  start()

  await queue

  // summary
  console.log(`---\n`)
  const total = passed + failed + skipped
  if (only) console.log(`# only ${only} cases`)
  console.log(`# total ${total}`)
  if (passed) console.log(`%c# pass ${passed}`, 'color: #229944')
  if (failed) console.log(`# fail ${failed}`)
  if (skipped) console.log(`# skip ${skipped}`)

  if (isNode) process.exit(failed ? 1 : 0)
})

export * from './assert.js'
