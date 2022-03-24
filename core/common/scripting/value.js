// @ts-check
import { Type } from '../constants.js';

export class Value {
    #value;
    #type;
    #expr;

    constructor(value, type, expr) {
        this.#value = value;
        this.#type = type;
        this.#expr = expr;
    }

    get value() {
        return this.#value;
    }

    get type() {
        return this.#type;
    }

    get expr() {
        return this.#expr;
    }

    isEqual(other) {
        if (this.type != other.type) return false;
        return this.value == other.value;
    }

    isTruthy() {
        if (this.type == Type.NULL) return false;
        if (this.type == Type.BOOLEAN) return this.value;
        return true;
    }

    static NULL = new Value(null, Type.NULL, 'null');
    static ONE = new Value(1, Type.DOUBLE, '1');
    static ZERO = new Value(0, Type.DOUBLE, '0');
}
