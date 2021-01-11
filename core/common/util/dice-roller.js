export class DiceRoller {
    static roll(sides) {
        return Math.floor(Math.random() * sides) + 1;
    }
}
