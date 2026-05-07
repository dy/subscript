/**
 * Membership operator - parse half
 *
 * in: key in object
 * of: for-of iteration (parsed as binary in for head)
 */
import { binary } from '../../parse.js';

const COMP = 90;

binary('in', COMP);
binary('of', COMP);
