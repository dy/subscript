import { skip, err, cur, idx, lookup } from '../src/parse.js'
import { DQUOTE, QUOTE, BSLASH } from '../src/const.js'

const escape = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v' },
  string = q => (qc, c, str = '') => {
    qc && err('Unexpected string') // must not follow another token
    skip() // first quote
    while (c = cur.charCodeAt(idx), c - q) {
      if (c === BSLASH) skip(), c = skip(), str += escape[c] || c
      else str += skip()
    }
    skip() || err('Bad string')
    return ['', str]
  }


// "' with /
lookup[DQUOTE] = string(DQUOTE)
lookup[QUOTE] = string(QUOTE)
