// ASI (Automatic Semicolon Insertion) preprocessor
// Wraps input to insert semicolons where JS would infer them
// Not a full JS spec implementation - covers common practical cases

// Tokens that REQUIRE continuation (don't insert ; before these)
// Note: [ and { can START statements (array literal, block), so not included
const CONT_STARTS = /^[\.\(\+\-\*\/\%\&\|\^\~\?\:\,\<\>]|^&&|^\|\||^\.\.\.$/

// Lines that can't be statements by themselves (incomplete)
const INCOMPLETE = /[\+\-\*\/\%\&\|\^\~\?\:\,\=\<\>\(\{]$/

export function asi(src, { keepNewlines = false } = {}) {
  const lines = src.split('\n')
  const result = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip empty lines
    if (!line) {
      if (keepNewlines) result.push(lines[i])
      continue
    }

    // Skip comment lines
    if (line.startsWith('//') || line.startsWith('/*')) {
      if (keepNewlines) result.push(lines[i])
      continue
    }

    result.push(lines[i])

    // Already ends with semicolon, opening brace, comma, or closing brace - no insert
    if (line.endsWith(';') || line.endsWith('{') || line.endsWith(',') || line.endsWith('}')) continue

    // Line is incomplete (ends with operator/opening paren) - no insert
    if (INCOMPLETE.test(line)) continue

    // Find next non-empty, non-comment line
    let nextLine = ''
    for (let j = i + 1; j < lines.length; j++) {
      const nl = lines[j].trim()
      if (nl && !nl.startsWith('//') && !nl.startsWith('/*')) {
        nextLine = nl
        break
      }
    }

    // Next line starts with continuation token - no insert
    const nextToken = nextLine.match(/^[^\s\w]*|^\w+/)?.[0] || ''
    if (nextLine && CONT_STARTS.test(nextToken)) continue

    // If this is NOT the last code line, add semicolon
    // (Don't add trailing semicolon - it makes result undefined)
    if (nextLine) {
      result[result.length - 1] = result[result.length - 1] + ';'
    }
  }

  // Join with space instead of newline for parser compatibility
  return result.join(keepNewlines ? '\n' : ' ')
}

// Wrap parse function with ASI preprocessing
export function withASI(parse) {
  return (src, ...args) => parse(asi(src), ...args)
}

export default asi
