// @ts-check
import { Expr } from './expr.js';
import { Token } from './token.js';
/** @typedef {import('./token.js').COMPARISON} COMPARISON */

/**
 * Defines a single dice roll modifier.
 */
export class DiceModifier {
    #identifier;
    #comparison;
    #value;

    /**
     * @param {Token} identifier the identifier Token for this modifier
     * @param {COMPARISON} comparison the comparison method to use
     * @param {Expr} value the expression evaluating to the comparison value
     */
    constructor(identifier, comparison, value) {
        this.#identifier = identifier;
        this.#comparison = comparison;
        this.#value = value;
    }

    /** the identifier Token for this modifier */
    get identifier() {
        return this.#identifier;
    }

    /** the comparison method to use */
    get comparison() {
        return this.#comparison;
    }

    /** the expression evaluating to the comparison value */
    get value() {
        return this.#value;
    }
}
