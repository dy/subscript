/**
 * Logical/nullish assignment operators - parse half
 *
 * ||= &&= ??=
 */
import { binary } from '../../parse.js';

const ASSIGN = 20;

binary('||=', ASSIGN, true);
binary('&&=', ASSIGN, true);
binary('??=', ASSIGN, true);
