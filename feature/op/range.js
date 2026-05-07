/**
 * Range operators - parse half
 *
 * .. (inclusive range): 1..5 → [1,2,3,4,5]
 * ..< (exclusive range): 1..<5 → [1,2,3,4]
 */
import { binary } from '../../parse.js';

const COMP = 90;

binary('..', COMP);
binary('..<', COMP);
