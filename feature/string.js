import { skip, err, next, cur, idx, lookup } from '../src/parse.js'
import { DQUOTE, QUOTE, BSLASH } from '../src/const.js'

const escape = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v' },
  string = q => (qc, prec, str = '') => {
    qc && err('Unexpected string') // must not follow another token
    skip()
    // while (c = cur.charCodeAt(idx), c - q) {
    //   if (c === BSLASH) skip(), c = cur[idx], skip(), str += escape[c] || c
    //   else str += cur[idx], skip()
    // }
    next(c => c - q && (c === BSLASH ? (str += escape[cur[idx+1]] || cur[idx+1], 2 ) : (str += cur[idx], 1)))
    skip() || err('Bad string')
    return [, str]
  }


// "' with /
lookup[DQUOTE] = string(DQUOTE)
lookup[QUOTE] = string(QUOTE)
