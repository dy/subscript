// Shebang `#!...` line treated as a line comment.
// `#!` is not valid syntax outside the shebang context (private fields require an identifier),
// so registering it globally is safe and lets the existing comment machinery handle it.
import './comment.js';
import { parse } from '../parse.js';

parse.comment['#!'] = '\n';
