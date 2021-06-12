import { Type } from '../constants.js';
import { Value } from './value.js';

export class ScrArray extends Value {
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

    get(index) {
        if(this.#array[index]) return this.#array[index];
        return Value.NULL;
    }

    set(index, value) {
        this.#array[index] = value;
    }
}
