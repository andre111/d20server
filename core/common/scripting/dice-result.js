// @ts-check
import { SerializeWithGetters } from '../util/serialize-with-getters.js';

/**
 * Represents the result of a single rolled die.
 */
export class DiceResult extends SerializeWithGetters {
    #value;
    #sides;
    #label;

    #counted;
    #criticalSuccess;
    #criticalFailure;

    /**
     * @param {number} value the rolled value
     * @param {number} sides the number of sides of the die
     * @param {string} label the dice label, can be empty
     * @param {boolean} counted should this die be counted in final value calculations
     * @param {boolean} criticalSuccess should this die value be interpreted as a critical success
     * @param {boolean} criticalFailure should this die value be interpreted as a critical failure
     */
    constructor(value, sides, label, counted, criticalSuccess, criticalFailure) {
        super();
        this.#value = value;
        this.#sides = sides;
        this.#label = label;

        this.#counted = counted;
        this.#criticalSuccess = criticalSuccess;
        this.#criticalFailure = criticalFailure;
    }

    /** the rolled value */
    get value() {
        return this.#value;
    }

    /** the number of sides of the die */
    get sides() {
        return this.#sides;
    }

    /** the dice label, can be empty */
    get label() {
        return this.#label;
    }

    /** should this die be counted in final value calculations */
    get counted() {
        return this.#counted;
    }

    //TODO: DiceResult should preferrably be unmodifieable, but that requires larger changes to current dice code
    set counted(c) {
        this.#counted = c;
    }

    /** should this die value be interpreted as a critical success */
    get criticalSuccess() {
        return this.#criticalSuccess;
    }

    /** should this die value be interpreted as a critical failure */
    get criticalFailure() {
        return this.#criticalFailure;
    }
}
