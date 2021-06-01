import { RuntimeError } from './runtime-error.js';

export class Environment {
    #enclosing;
    #values = {};

    constructor(enclosing = null) {
        this.#enclosing = enclosing;
    }

    assign(name, value) {
        if(this.#values.hasOwnProperty(name.lexeme)) {
            this.#values[name.lexeme] = value;
            return;
        }

        if(this.#enclosing) {
            this.#enclosing.assign(name, value);
            return;
        }

        throw new RuntimeError(name, 'Undefined variable '+name.lexeme);
    }

    define(name, value) {
        this.#values[name] = value;
    }

    get(name) {
        if(this.#values.hasOwnProperty(name.lexeme)) {
            return this.#values[name.lexeme];
        }

        if(this.#enclosing) {
            return this.#enclosing.get(name);
        }
        
        throw new RuntimeError(name, 'Undefined variable '+name.lexeme);
    }
}
