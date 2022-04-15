// @ts-check
import { Type } from '../constants.js';
import { Value } from './value.js';

/**
 * Extension of Value to represent arrays inside the scripting system.
 */
export class ScrArray extends Value {
    /** @type {Value[]} */
    #array = [];

    constructor() {
        super('[...]', Type.ARRAY, 'array()');
    }

    get value() {
        return this;
    }

    get length() {
        return this.#array.length;
    }

    /**
     * Gets the {@link Value} at the provided index.
     * @param {number} index the index
     * @returns {Value} the Value at the provided index, or the null Value
     */
    get(index) {
        if (this.#array[index]) return this.#array[index];
        return Value.NULL;
    }

    /**
     * Sets the value at the provided index.
     * @param {number} index the index
     * @param {Value} value the value to set
     */
    set(index, value) {
        this.#array[index] = value;
    }
}
