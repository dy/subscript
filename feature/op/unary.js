/**
 * Unary keyword operators
 *
 * typeof x → type string
 * void x → undefined
 * delete x → remove property
 * new X() → construct instance
 *
 * JS-specific keywords
 */
import { unary } from '../../parse/pratt.js';

const PREFIX = 140;

unary('typeof', PREFIX);
unary('void', PREFIX);
unary('delete', PREFIX);
unary('new', PREFIX);
