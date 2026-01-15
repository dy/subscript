/**
 * Range operators
 *
 * .. (inclusive range): 1..5 → [1,2,3,4,5]
 * ..< (exclusive range): 1..<5 → [1,2,3,4]
 *
 * Common in: Swift, Kotlin, Rust, Ruby
 */
import { binary } from '../../parse/pratt.js';

const COMP = 90;

binary('..', COMP);
binary('..<', COMP);
