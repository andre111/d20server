// @ts-check
import { Token } from './token.js';

/**
 * Represents a located Error inside the scripting system.
 */
export class RuntimeError extends Error {
    #token;

    /**
     * @param {Token} token the token at which the error occured
     * @param {string} message the error message
     */
    constructor(token, message) {
        super(message);
        this.#token = token;
    }

    /** the token at which the error occured */
    get token() {
        return this.#token;
    }
}
