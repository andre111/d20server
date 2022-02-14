import { Type } from '../constants.js';
import { DiceRoller } from '../util/dice-roller.js';
import { RuntimeError } from './runtime-error.js';
import { EQUAL_EQUAL, GREATER, GREATER_EQUAL, LESS, LESS_EQUAL } from './token.js';
import { Value } from './value.js';

export class Modifier {
    #identifier;
    #comparison;
    #value;

    constructor(identifier, comparison, value) {
        this.#identifier = identifier;
        this.#comparison = comparison;
        this.#value = value;
    }

    get identifier() {
        return this.#identifier;
    }

    get comparison() {
        return this.#comparison;
    }

    get value() {
        return this.#value;
    }
}

export function performDiceRolls(interpreter, dice) {
    // evaluate and check base values (count and sides)
    //---------------------------------------------------
    const count = evaluateDouble(interpreter, dice.token, dice.count);
    const sides = evaluateDouble(interpreter, dice.token, dice.sides);
    if (count == 0) return Value.ZERO;
    if (count < 0) throw new RuntimeError(dice.token, 'Cannot throw ' + count + ' dice');
    if (sides <= 0) throw new RuntimeError(dice.token, 'Cannot throw ' + sides + ' sided dice');

    // setup default behaviour
    //---------------------------------------------------
    var cfComparison = EQUAL_EQUAL;
    var cfValue = 1;
    var csComparison = EQUAL_EQUAL;
    var csValue = sides;

    var explodeComparison = EQUAL_EQUAL;
    var explodeValue = 0;
    var maxExplodeCount = 100;

    var highAction = NOTHING;
    var highValue = 0;
    var lowAction = NOTHING;
    var lowValue = 0;

    var rerollComparison = EQUAL_EQUAL;
    var rerollValue = 0;
    var maxRerollCount = 100;

    var label = dice.label ? dice.label.literal : '';

    // process modifiers
    //---------------------------------------------------
    for (const modifier of dice.modifiers) {
        switch (modifier.identifier.lexeme) {
            case 'cf':
                cfComparison = modifier.comparison.type;
                cfValue = evaluateDouble(interpreter, dice.token, modifier.value);
                break;
            case 'cs':
                csComparison = modifier.comparison.type;
                csValue = evaluateDouble(interpreter, dice.token, modifier.value);
                break;
            case 'e':
            case 'eo':
                explodeComparison = modifier.comparison.type;
                explodeValue = evaluateDouble(interpreter, dice.token, modifier.value);
                if (modifier.identifier.lexeme == 'eo') maxExplodeCount = 1;
                break;
            case 'dh':
                highAction = DROP;
                highValue = evaluateDouble(interpreter, dice.token, modifier.value);
                break;
            case 'dl':
                lowAction = DROP;
                lowValue = evaluateDouble(interpreter, dice.token, modifier.value);
                break;
            case 'kh':
                highAction = KEEP;
                highValue = evaluateDouble(interpreter, dice.token, modifier.value);
                break;
            case 'kl':
                lowAction = KEEP;
                lowValue = evaluateDouble(interpreter, dice.token, modifier.value);
                break;
            case 'r':
            case 'ro':
                rerollComparison = modifier.comparison.type;
                rerollValue = evaluateDouble(interpreter, dice.token, modifier.value);
                if (modifier.identifier.lexeme == 'ro') maxRerollCount = 1;
                break;
            default:
                throw new RuntimeError(modifier.identifier, 'Unknown modifier');
        }
    }

    // calculate all required dice
    //---------------------------------------------------
    const results = [];
    var realCount = 0;
    for (var i = 0; i < count; i++) {
        var roll;
        var explodeCount = 0;
        do {
            // calculate roll
            roll = DiceRoller.roll(sides);

            realCount++;
            if (realCount > 1000) throw new RuntimeError(dice.token, 'Number of rolls exceeded 1000');

            // handle re-rolling
            var rerollCount = 0;
            while (match(roll, rerollComparison, rerollValue) && rerollCount < maxRerollCount) {
                results.push(new DiceResult(roll, match(roll, cfComparison, cfValue), match(roll, csComparison, csValue), false));
                roll = DiceRoller.roll(sides);
                rerollCount++;

                realCount++;
                if (realCount > 1000) throw new RuntimeError(dice.token, 'Number of rolls exceeded 1000');
            }

            results.push(new DiceResult(roll, match(roll, cfComparison, cfValue), match(roll, csComparison, csValue), true));
            // handle exploding dice
        } while (match(roll, explodeComparison, explodeValue) && explodeCount++ < maxExplodeCount);
    }

    // apply drop/keep modifiers
    //---------------------------------------------------
    const sortedResults = Array.from(results);
    sortedResults.sort((a, b) => a.value - b.value);
    var currentLowCount = 0;
    for (var i = 0; i < sortedResults.length; i++) {
        const result = sortedResults[i];
        if (result.counted) {
            if (lowAction == DROP && currentLowCount < lowValue) {
                result.dropped = true;
            } else if (lowAction == KEEP && currentLowCount >= lowValue) {
                result.kept = false;
            }
            currentLowCount++;
        }
    }
    var currentHighCount = 0;
    for (var i = sortedResults.length - 1; i >= 0; i--) {
        const result = sortedResults[i];
        if (result.counted) {
            if (highAction == DROP && currentHighCount < highValue) {
                result.dropped = true;
            } else if (highAction == KEEP && currentHighCount >= highValue) {
                result.kept = false;
            }
        }
        currentHighCount++;
    }

    // calculate result
    //---------------------------------------------------
    var value = 0;
    var string = '';

    if (results.length > 1) string = string + '(';
    for (var i = 0; i < results.length; i++) {
        const result = results[i];

        // apply value
        if (result.shouldBeIncluded()) {
            value += result.value;
        }

        // track rolls //TODO: convert this to an actual class - maybe just use DiceResult?
        interpreter.addDiceRoll({
            sides: sides,
            result: result.value,
            label: label,
            counted: result.shouldBeIncluded(),
            cf: result.criticalFailure,
            cs: result.criticalSuccess
        });

        // build string (with colored misses/crits)
        if (i > 0) string = string + '+';
        if (sides == 4 || sides == 6 || sides == 8 || sides == 10 || sides == 12 || sides == 20) {
            string = string + result.getRollValue('', '', `chat-dice-bg chat-dice-${sides}`);
        } else {
            string = string + result.getRollValue('&lt;', '&gt;', '');
        }
    }
    if (results.length > 1) string = string + ')';

    return new Value(value, Type.DOUBLE, string);
}

//TODO: this class does not follow the new style
class DiceResult {
    value;
    criticalFailure;
    criticalSuccess;
    counted;

    dropped = false;
    kept = true;

    constructor(value, criticalFailure, criticalSuccess, counted) {
        this.value = value;
        this.criticalFailure = criticalFailure;
        this.criticalSuccess = criticalSuccess;
        this.counted = counted;
    }

    shouldBeIncluded() {
        return this.counted && !this.dropped && this.kept;
    }

    getRollValue(prefix, postfix, cl) {
        // build class name(s)
        if (this.criticalFailure) {
            cl = (cl === '' ? 'chat-dice-fail' : cl + ' chat-dice-fail')
        } else if (this.criticalSuccess) {
            cl = (cl === '' ? 'chat-dice-crit' : cl + ' chat-dice-crit')
        }
        if (!this.shouldBeIncluded()) {
            cl = (cl === '' ? 'chat-dice-uncounted' : cl + ' chat-dice-uncounted');
        }

        // build string
        return `${prefix}<span class="${cl}">${this.value}</span>${postfix}`;
    }
}

const NOTHING = Symbol();
const DROP = Symbol();
const KEEP = Symbol();

function evaluateDouble(interpreter, token, expr, truncate = true) {
    const value = expr.accept(interpreter);
    interpreter.checkOperandType(token, value, Type.DOUBLE);
    return truncate ? Math.trunc(value.value) : value.value;
}

function evaluateString(interpreter, token, expr) {
    const value = expr.accept(interpreter);
    interpreter.checkOperandType(token, value, Type.STRING);
    return value.value;
}

function match(value1, comparison, value2) {
    switch (comparison) {
        case EQUAL_EQUAL: return value1 == value2;
        case GREATER: return value1 > value2;
        case GREATER_EQUAL: return value1 >= value2;
        case LESS: return value1 < value2;
        case LESS_EQUAL: return value1 <= value2;
    }
    return false; // unreachable
}
