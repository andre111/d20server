// @ts-check
export class DiceRoller {
    /**
     * Rolls a 'sides' sided die.
     * @param {number} sides the number of sides
     * @returns {number} the result value
     */
    static roll(sides) {
        return Math.floor(Math.random() * sides) + 1;
    }
}
