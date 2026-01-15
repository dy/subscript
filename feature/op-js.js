/**
 * JS-specific operators (convenience re-export)
 *
 * Imports all JS-specific operator modules:
 * - ternary: a ? b : c
 * - arrow: () => x
 * - spread: ...x
 * - optional: a?.b, a?.[x], a?.()
 * - unary: typeof, void, delete, new
 */
import './op/ternary.js';
import './op/arrow.js';
import './op/spread.js';
import './op/optional.js';
import './op/unary.js';
