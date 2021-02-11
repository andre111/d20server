import { Expression } from '../expression.js';
import { Result } from '../result.js';
import { Condition } from './condition.js';
import { ZERO, ONE, Expr } from './expr.js';
import { DiceRoller } from '../../util/dice-roller.js';

class DiceResult {
    sides;
    value;
    criticalFailure;
    criticalSuccess;
    counted;

    dropped = false;
    kept = true;

    constructor(sides, value, criticalFailure, criticalSuccess, counted) {
        this.sides = sides;
        this.value = value;
        this.criticalFailure = criticalFailure;
        this.criticalSuccess = criticalSuccess;
        this.counted = counted;
    }

    shouldBeIncluded() {
        return this.counted && !this.dropped && this.kept;
    }
}

export class Dice extends Expression {
    count;
    sides;

    criticalFailureCondition;
    criticalSuccessCondition;

    rerollCondition;
    maxRerollCount = 100;

    explodeDice = false;
    maxExplodeDice = 100;

    lowAction = Dice.Action.NOTHING;
    lowCount = ZERO;
    highAction = Dice.Action.NOTHING;
    highCount = ZERO;

    label = '';

    constructor(count, sides) {
        super();

        this.count = count;
        this.sides = sides;
    }

    setCriticalFailureCondition(criticalFailureCondition) {
        this.criticalFailureCondition = criticalFailureCondition;
    }

    setCriticalSuccessCondition(criticalSuccessCondition) {
        this.criticalSuccessCondition = criticalSuccessCondition;
    }

    setRerollCondition(rerollCondition) {
        this.rerollCondition = rerollCondition;
    }

    setMaxRerollCount(maxRerollCount) {
        this.maxRerollCount = maxRerollCount;
    }

    setExplodeDice(explodeDice) {
        this.explodeDice = explodeDice;
    }

    setMaxExplodeCount(maxExplodeCount) {
        this.maxExplodeCount = maxExplodeCount;
    }

    setLowAction(lowAction) {
        this.lowAction = lowAction;
    }

    setLowCount(lowCount) {
        this.lowCount = lowCount;
    }

    setHighAction(highAction) {
        this.highAction = highAction;
    }

    setHighCount(highCount) {
        this.highCount = highCount;
    }

    setLabel(label) {
        this.label = label;
    }

    eval(context) {
        // eval basic values 
		//---------------------------------------------------
        // (count + sides)
        const countValue = Math.trunc(this.count.eval(context).getValue());
        const sidesValue = Math.trunc(this.sides.eval(context).getValue());
        if(countValue == 0) return ZERO;
        if(countValue <= 0) throw new Error(`Cannot throw ${countValue} dice`);
        if(sidesValue <= 0) throw new Error(`Cannot throw ${sidesValue} sided dice`);

        // (high/low counts)
        const lowCountValue = Math.trunc(this.lowCount.eval(context).getValue());
        const highCountValue = Math.trunc(this.highCount.eval(context).getValue());

        // prepare default conditions if none are set
        if(!this.criticalFailureCondition) this.criticalFailureCondition = new Condition(Condition.Type.EQUAL, ONE);
        if(!this.criticalSuccessCondition) this.criticalSuccessCondition = new Condition(Condition.Type.EQUAL, new Expr(c => new Result(sidesValue, String(sidesValue))));

        // eval condition values
        this.criticalFailureCondition.eval(context);
        this.criticalSuccessCondition.eval(context);
        if(this.rerollCondition) this.rerollCondition.eval(context);

		// calculate all required dice
        //---------------------------------------------------
        var results = [];
        var realCount = 0;
        for(var i=0; i<countValue; i++) {
            var roll;
            var explodeCount = 0;
            do {
                // calculate roll
                roll = DiceRoller.roll(sidesValue);

                realCount++;
                if(realCount > 1000) throw new Error(`Number of rolls exceeded 1000`);

                // handle re-rolling
                var rerollCount = 0;
                while(this.rerollCondition && this.rerollCondition.matches(roll) && rerollCount < this.maxRerollCount) {
                    results.push(new DiceResult(sidesValue, roll, this.criticalFailureCondition.matches(roll), this.criticalSuccessCondition.matches(roll), false));
                    roll = DiceRoller.roll(sidesValue);
                    rerollCount++;

                    realCount++;
                    if(realCount > 1000) throw new Error(`Number of rolls exceeded 1000`);
                }

                results.push(new DiceResult(sidesValue, roll, this.criticalFailureCondition.matches(roll), this.criticalSuccessCondition.matches(roll), true));
			// handle exploding dice
            } while(this.explodeDice && roll == sidesValue && explodeCount++ < this.maxExplodeCount);
        }
        
		// apply drop/keep modifiers
        //---------------------------------------------------
        var sortedResults = Array.from(results);
        sortedResults.sort((a, b) => a.value - b.value);
        var currentLowCount = 0;
		for(var i=0; i<sortedResults.length; i++) {
            const result = sortedResults[i];
            if(result.counted) {
                if(this.lowAction == Dice.Action.DROP && currentLowCount < lowCountValue) {
                    result.dropped = true;
                } else if(this.lowAction == Dice.Action.KEEP && currentLowCount >= lowCountValue) {
                    result.kept = false;
                }
                currentLowCount++;
            }
        }
        var currentHighCount = 0;
		for(var i=sortedResults.length-1; i>=0; i--) {
            const result = sortedResults[i];
            if(result.counted) {
                if(this.highAction == Dice.Action.DROP && currentHighCount < highCountValue) {
                    result.dropped = true;
                } else if(this.highAction == Dice.Action.KEEP && currentHighCount >= highCountValue) {
                    result.kept = false;
                }
            }
            currentHighCount++;
        }

		// calculate result
        //---------------------------------------------------
        var value = 0;
        var string = '';
        var diceRolls = [];

        if(results.length > 1) string = string + '(';
        for(var i=0; i<results.length; i++) {
            const result = results[i];

            // apply value
            if(result.shouldBeIncluded()) {
                value += result.value;
            }

            // track rolls //TODO: convert this to an actual class - maybe just use DiceResult?
            diceRolls.push({
                sides: result.sides,
                result: result.value,
                label: this.label,
                counted: result.shouldBeIncluded(),
                cf: result.criticalFailure,
                cs: result.criticalSuccess
            });

            // build string (with colored misses/crits)
            if(i > 0) string = string + '+';
            if(sidesValue == 4 || sidesValue == 6 || sidesValue == 8 || sidesValue == 10 || sidesValue == 12 || sidesValue == 20) {
                string = string + this.getRollValue('', result, '', `chat-dice-bg chat-dice-${sidesValue}`);
            } else {
                string = string + this.getRollValue('&lt;', result, '&gt;', '');
            }
        }
        if(results.length > 1) string = string + ')';

        return new Result(value, string, diceRolls);
    }

    getRollValue(prefix, result, postfix, cl) {
        // build class name(s)
        if(result.criticalFailure) {
            cl = (cl === '' ? 'chat-dice-fail' : cl + ' chat-dice-fail')
        } else if(result.criticalSuccess) {
            cl = (cl === '' ? 'chat-dice-crit' : cl + ' chat-dice-crit')
        }

        // build string
        var string = prefix;
        string = string + `<span class="${cl}">`;
        string = string + result.value;
        string = string + '</span>';
        string = string + postfix;

        return string;
    }

    static Action = {
        NOTHING: 'NOTHING',
        DROP: 'DROP',
        KEEP: 'KEEP'
    }
}
