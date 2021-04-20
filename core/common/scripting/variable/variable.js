import { Expression } from '../expression.js';
import { Result } from "../result.js";

export class Variable extends Expression {
    #fullName;

    constructor(fullName) {
        super();

        this.#fullName = fullName;
    }

    getType(context) { throw new Error('Cannot call abstract function'); }

    set(context, value) { throw new Error('Cannot call abstract function'); }
    get(context) { throw new Error('Cannot call abstract function'); }

    eval(context) {
        // get value
        const valueObject = this.get(context);
        var value = 0;

        // try to interpret as number
        if(typeof(valueObject) === 'boolean') {
            value = valueObject ? 1 : 0;
        } else {
            value = Number(valueObject);
        }

        // return result
        return new Result(value, `{${value}}`, []);
    }

    getFullName() {
        return this.#fullName;
    }
}
