/**
 * Membership/instance operators
 *
 * in: key in object
 * of: for-of iteration (parsed as binary in for head)
 * instanceof: object instanceof Constructor
 */
import { binary } from '../../parse/pratt.js';

const COMP = 90;

binary('in', COMP);
binary('of', COMP);
binary('instanceof', COMP);
