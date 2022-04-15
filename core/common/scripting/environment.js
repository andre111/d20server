// @ts-check
import { RuntimeError } from './runtime-error.js';
import { Token } from './token.js';
import { Value } from './value.js';

//TODO: this should not need references to Token and instead use simple strings, currently the tokens are used for error creation -> think of a better system
export class Environment {
    #enclosing;
    /** @type {Object<string, Value>} */
    #values = {};

    /**
     * Constructs a new Environment, optionally with an enclosing one.
     * @param {Environment} enclosing the enclosing Environment, or null for top level
     */
    constructor(enclosing = null) {
        this.#enclosing = enclosing;
    }

    /**
     * Assigns a new value to the named variable.
     * If this environment does not contain the named variable it will:
     * First try passing the assign to its enclosing environment
     * or otherwise throw an Error
     * @param {Token} name the name of the variable to assign to
     * @param {Value} value the value to assign
     * @throws {RuntimeError} if the named variable is undefined
     */
    assign(name, value) {
        if (this.#values.hasOwnProperty(name.lexeme)) {
            this.#values[name.lexeme] = value;
            return;
        }

        if (this.#enclosing) {
            this.#enclosing.assign(name, value);
            return;
        }

        throw new RuntimeError(name, 'Undefined variable ' + name.lexeme);
    }

    /**
     * Defines a variable in this environment and assigns the initial value.
     * If a variable when the name already exists it will be overridden.
     * @param {string} name the name of the variable to define
     * @param {Value} value the initial value
     */
    define(name, value) {
        this.#values[name] = value;
    }

    /**
     * Returns the {@link Value} stored in the named variable.
     * If this environment does not contain the named variable it will:
     * First try passing the get to its enclosing environment
     * or otherwise throw an Error
     * @param {Token} name the name of the variable
     * @returns {Value} the value
     * @throws {RuntimeError} if the named variable is undefined
     */
    get(name) {
        if (this.#values.hasOwnProperty(name.lexeme)) {
            return this.#values[name.lexeme];
        }

        if (this.#enclosing) {
            return this.#enclosing.get(name);
        }

        throw new RuntimeError(name, 'Undefined variable ' + name.lexeme);
    }
}
