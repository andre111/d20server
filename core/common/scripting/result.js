export class Result {
    v;
    s;
    drs;

    constructor(value, string, ...diceRolls) {
        this.v = value;
        this.s = string;
        this.drs = diceRolls.flat();
    }

    getValue() {
        return this.v;
    }

    getString() {
        return this.s;
    }

    getDiceRolls() {
        return this.drs;
    }

    hadCriticalFailure() {
        for(const roll of this.drs) {
            if(roll.cf) return true;
        }
        return false;
    }

    hadCriticalSuccess() {
        for(const roll of this.drs) {
            if(roll.cs) return true;
        }
        return false;
    }
}
