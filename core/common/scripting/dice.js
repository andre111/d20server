// @ts-check
import { Type } from '../constants.js';
import { DiceRoller } from '../util/dice-roller.js';
import { DiceResult } from './dice-result.js';
import { Dice, Expr } from './expr.js';
import { Interpreter } from './interpreter.js';
import { RuntimeError } from './runtime-error.js';
import { EQUAL_EQUAL, GREATER, GREATER_EQUAL, LESS, LESS_EQUAL, Token } from './token.js';
import { Value } from './value.js';
/** @typedef {import('./token.js').COMPARISON} COMPARISON */

/**
 * Performs the dice rolls as defined by the dice expression.
 * @param {Interpreter} interpreter the interpreter to use
 * @param {Dice} dice the dice expression to use
 * @returns {Value} the final calculated value
 */
export function performDiceRolls(interpreter, dice) {
    // evaluate and check base values (count and sides)
    //---------------------------------------------------
    const count = evaluateWholeNumber(interpreter, dice.token, dice.count);
    const sides = evaluateWholeNumber(interpreter, dice.token, dice.sides);
    if (count == 0) return Value.ZERO;
    if (count < 0) throw new RuntimeError(dice.token, 'Cannot throw ' + count + ' dice');
    if (sides <= 0) throw new RuntimeError(dice.token, 'Cannot throw ' + sides + ' sided dice');

    // setup default behaviour
    //---------------------------------------------------
    /** @type {COMPARISON} */
    var cfComparison = EQUAL_EQUAL;
    var cfValue = 1;
    /** @type {COMPARISON} */
    var csComparison = EQUAL_EQUAL;
    var csValue = sides;

    /** @type {COMPARISON} */
    var explodeComparison = EQUAL_EQUAL;
    var explodeValue = 0;
    var maxExplodeCount = 100;

    var highAction = NOTHING;
    var highValue = 0;
    var lowAction = NOTHING;
    var lowValue = 0;

    /** @type {COMPARISON} */
    var rerollComparison = EQUAL_EQUAL;
    var rerollValue = 0;
    var maxRerollCount = 100;

    const label = dice.label ?? '';

    // process modifiers
    //---------------------------------------------------
    for (const modifier of dice.modifiers) {
        switch (modifier.identifier.lexeme) {
            case 'cf':
                cfComparison = modifier.comparison;
                cfValue = evaluateWholeNumber(interpreter, dice.token, modifier.value);
                break;
            case 'cs':
                csComparison = modifier.comparison;
                csValue = evaluateWholeNumber(interpreter, dice.token, modifier.value);
                break;
            case 'e':
            case 'eo':
                explodeComparison = modifier.comparison;
                explodeValue = evaluateWholeNumber(interpreter, dice.token, modifier.value);
                if (modifier.identifier.lexeme == 'eo') maxExplodeCount = 1;
                break;
            case 'dh':
                highAction = DROP;
                highValue = evaluateWholeNumber(interpreter, dice.token, modifier.value);
                break;
            case 'dl':
                lowAction = DROP;
                lowValue = evaluateWholeNumber(interpreter, dice.token, modifier.value);
                break;
            case 'kh':
                highAction = KEEP;
                highValue = evaluateWholeNumber(interpreter, dice.token, modifier.value);
                break;
            case 'kl':
                lowAction = KEEP;
                lowValue = evaluateWholeNumber(interpreter, dice.token, modifier.value);
                break;
            case 'r':
            case 'ro':
                rerollComparison = modifier.comparison;
                rerollValue = evaluateWholeNumber(interpreter, dice.token, modifier.value);
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
                results.push(new DiceResult(roll, sides, label, false, match(roll, csComparison, csValue), match(roll, cfComparison, cfValue)));
                roll = DiceRoller.roll(sides);
                rerollCount++;

                realCount++;
                if (realCount > 1000) throw new RuntimeError(dice.token, 'Number of rolls exceeded 1000');
            }

            results.push(new DiceResult(roll, sides, label, true, match(roll, csComparison, csValue), match(roll, cfComparison, cfValue)));
            // handle exploding dice
        } while (match(roll, explodeComparison, explodeValue) && explodeCount++ < maxExplodeCount);
    }

    // apply drop/keep modifiers
    //---------------------------------------------------
    //TODO: rewrite this to replace the dice results (in both the results and sortedResults arrays) with new objects, then remove the result.counted setter
    const sortedResults = Array.from(results);
    sortedResults.sort((a, b) => a.value - b.value);
    var currentLowCount = 0;
    for (var i = 0; i < sortedResults.length; i++) {
        const result = sortedResults[i];
        if (result.counted) {
            if (lowAction == DROP && currentLowCount < lowValue) {
                result.counted = false;
            } else if (lowAction == KEEP && currentLowCount >= lowValue) {
                result.counted = false;
            }
            currentLowCount++;
        }
    }
    var currentHighCount = 0;
    for (var i = sortedResults.length - 1; i >= 0; i--) {
        const result = sortedResults[i];
        if (result.counted) {
            if (highAction == DROP && currentHighCount < highValue) {
                result.counted = false;
            } else if (highAction == KEEP && currentHighCount >= highValue) {
                result.counted = false;
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
        if (result.counted) {
            value += result.value;
        }

        // track rolls
        interpreter.addDiceRoll(result);

        // build string (with colored misses/crits)
        if (i > 0) string = string + '+';
        if (sides == 4 || sides == 6 || sides == 8 || sides == 10 || sides == 12 || sides == 20) {
            string = string + getRollValue(result, '', '', `chat-dice-bg chat-dice-${sides}`);
        } else {
            string = string + getRollValue(result, '&lt;', '&gt;', '');
        }
    }
    if (results.length > 1) string = string + ')';

    return new Value(value, Type.DOUBLE, string);
}

/**
 * Gets a formatted HTML string showing the roll value and state (counted, criticalSuccess, criticalFailure).
 * @param {DiceResult} dr the dice roll
 * @param {string} prefix prefix for the value
 * @param {string} postfix postfix for the value
 * @param {string} cl custom css class(es) to use
 */
function getRollValue(dr, prefix, postfix, cl) {
    // build class name(s)
    if (dr.criticalFailure) {
        cl = (cl === '' ? 'chat-dice-fail' : cl + ' chat-dice-fail')
    } else if (dr.criticalSuccess) {
        cl = (cl === '' ? 'chat-dice-crit' : cl + ' chat-dice-crit')
    }
    if (!dr.counted) {
        cl = (cl === '' ? 'chat-dice-uncounted' : cl + ' chat-dice-uncounted');
    }

    // build string
    return `${prefix}<span class="${cl}">${dr.value}</span>${postfix}`;
}

const NOTHING = Symbol();
const DROP = Symbol();
const KEEP = Symbol();

/**
 * Evaluates the expression and returns the truncated number.
 * @param {Interpreter} interpreter the interpreter to use
 * @param {Token} token the token for placing errors
 * @param {Expr} expr the expresseion to evaluate
 * @returns {number} the evaluated number
 */
function evaluateWholeNumber(interpreter, token, expr) {
    const value = expr.accept(interpreter);
    interpreter.checkOperandType(token, value, Type.DOUBLE);
    return Math.trunc(value.value);
}

/**
 * Performs the comparison of value1 and value2.
 * @param {number} value1 the first value
 * @param {COMPARISON} comparison the comparison method to use
 * @param {number} value2 the second value
 * @returns {boolean} the result of the comparison
 */
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
