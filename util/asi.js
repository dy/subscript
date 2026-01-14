// ASI (Automatic Semicolon Insertion) preprocessor
// Wraps input to insert semicolons where JS would infer them
// Not a full JS spec implementation - covers common practical cases

// Tokens that REQUIRE continuation (don't insert ; before these)
const CONT_STARTS = /^[\)\]\}]|^[\.\+\-\*\/\%\&\|\^\~\?\:\,\<\>]|^&&|^\|\||^\.\.\.$/

// Lines that can't be statements by themselves (incomplete)
const INCOMPLETE = /[\+\-\*\/\%\&\|\^\~\?\:\,\=\<\>\(\{\[]$/

// Find inline comment position (not inside string/template)
const findComment = s => {
  for (let i = 0, q = 0; i < s.length; i++) {
    const c = s[i]
    if (q) { if (c === q && s[i-1] !== '\\') q = 0 }
    else if (c === '"' || c === "'" || c === '`') q = c
    else if (c === '/' && s[i+1] === '/') return i
  }
  return -1
}

// Track bracket/template depth to avoid inserting ; inside multiline constructs
// Uses a stack to handle nested templates: `a ${`b ${c}`} d`
const insideMultiline = lines => {
  let depth = 0, inQ = 0
  const tplStack = []  // stack of template depths
  
  for (const line of lines) {
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (inQ) { if (c === inQ && line[i-1] !== '\\') inQ = 0 }
      else if (tplStack.length && c === '`') tplStack.pop()  // end template
      else if (c === '`') tplStack.push(depth)  // start template
      else if (tplStack.length && c === '$' && line[i+1] === '{') { depth++; i++ }  // ${
      else if (tplStack.length && c === '}' && depth === tplStack[tplStack.length-1] + 1) depth--  // } ending ${}
      else if (!tplStack.length) {
        if (c === '"' || c === "'") inQ = c
        else if (c === '(' || c === '[' || c === '{') depth++
        else if (c === ')' || c === ']' || c === '}') depth--
      }
    }
  }
  return depth > 0 || tplStack.length > 0
}

export function asi(src, { keepNewlines = false } = {}) {
  const lines = src.split('\n'), result = []

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i], trim = line.trim()

    // Skip empty/comment-only lines
    if (!trim || trim.startsWith('//') || trim.startsWith('/*')) {
      if (keepNewlines) result.push(line)
      continue
    }

    // Split off inline comment
    const cp = findComment(line), comment = cp >= 0 ? line.slice(cp) : '', code = cp >= 0 ? line.slice(0, cp).trimEnd() : line
    const codeEnd = code.trimEnd()

    // Already ends with semicolon/brace/comma - no insert
    if (codeEnd.endsWith(';') || codeEnd.endsWith('{') || codeEnd.endsWith(',') || codeEnd.endsWith('}')) {
      result.push(line); continue
    }

    // Line is incomplete (ends with operator/opening paren/bracket) - no insert
    if (INCOMPLETE.test(codeEnd)) { result.push(line); continue }

    // Inside unclosed brackets/template - no insert
    if (insideMultiline(lines.slice(0, i + 1))) { result.push(line); continue }

    // Find next non-empty, non-comment line
    let nextLine = ''
    for (let j = i + 1; j < lines.length; j++) {
      const nl = lines[j].trim()
      if (nl && !nl.startsWith('//') && !nl.startsWith('/*')) { nextLine = nl; break }
    }

    // Next line starts with continuation token - no insert
    const nextToken = nextLine.match(/^[^\s\w]*|^\w+/)?.[0] || ''
    if (nextLine && CONT_STARTS.test(nextToken)) { result.push(line); continue }

    // Insert semicolon (before comment if present)
    result.push(nextLine ? (comment ? code + '; ' + comment : line + ';') : line)
  }

  return result.join(keepNewlines ? '\n' : ' ')
}

// Wrap parse function with ASI preprocessing
export function withASI(parse) {
  return (src, ...args) => parse(asi(src), ...args)
}

export default asi
