// @ts-check
import { Type } from '../constants.js';

/**
 * Represents a value with type and expression string inside the scripting system.
 */
export class Value {
    #value;
    #type;
    #expr;

    /**
     * @param {*} value the actual value
     * @param {string} type the type of this value, see {@link Type}
     * @param {string} expr the expression that evaluated to this value
     */
    constructor(value, type, expr) {
        this.#value = value;
        this.#type = type;
        this.#expr = expr;
    }

    /** the actual value */
    get value() {
        return this.#value;
    }

    /** the type of this value, see {@link Type} */
    get type() {
        return this.#type;
    }

    /** the expression that evaluated to this value */
    get expr() {
        return this.#expr;
    }

    //TODO: this is currently needed because of the string array set access, but really should not be possible
    set value(v) {
        this.#value = v;
    }

    /**
     * Tests if this Value is equal to another one.
     * @param {Value} other the other value
     * @returns {boolean} true if the two values have the same type and actual value, false otherwise
     */
    isEqual(other) {
        if (this.type != other.type) return false;
        return this.value == other.value;
    }

    /**
     * Tests if this Value is interpreted to be true.
     * @returns {boolean} the 'truthieness' of this Value
     */
    isTruthy() {
        if (this.type == Type.NULL) return false;
        if (this.type == Type.BOOLEAN) return this.value;
        return true;
    }

    static NULL = new Value(null, Type.NULL, 'null');
    static ONE = new Value(1, Type.DOUBLE, '1');
    static ZERO = new Value(0, Type.DOUBLE, '0');
}
