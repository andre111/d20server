import { Expr } from './expr.js';
import { Result } from '../result.js';
import { parseVariable } from '../variable/parser/variable-parsers.js';
import { Dice } from './dice.js';
import { Condition } from './condition.js';

// precreate regex expressions as that is a very expensive operation
const _isLetterExp = RegExp(/^\p{L}/, 'u');
function isLetter(str) {
    return _isLetterExp.test(str); // uses unicode category
}

const _isDigitExp = RegExp(/^\d/);
function isDigit(str) {
    return _isDigitExp.test(str); 
}

const _isIntegerExp = RegExp(/^\d+$/);

//TODO: this performs pretty badly in browser, see if it can be optimized 
//      (the charactersheet had no noticeable delays in the old client while it has in the new without caching the parsed expression)

//Grammar:
// expression = term | expression `+` term | expression `-` term
// term = factor | term `*` factor | term `/` factor
// factor = `+` factor | `-` factor | function | value
// function = identifier `(` parameters `)`
// parameters = expression | parameters `,` expression
// value = `{` identifier(variable) `}` | `(` expression `)` | number | value `D/W` dice
// dice = value modifiers | value modifiers `[` identifier `]`
// modifiers = modifier*
// modifier = `CS` condition | `CF` condition | `R` condition | `RO` condition | `!` | `!O` | `DL` value | `DH` value | `KL` value | `KH` value
// condition = value | `<` value | `<=` value | `>` value | `>=` value
export class Parser {
    string;
    pos;
    c;

    parse(string) {
        // unescape string
        string = string.replace('&lt;', '<');
        string = string.replace('&gt;', '>');

        // init
        this.string = string;
        this.pos = -1;
        this.nextChar();

        const expr = this.parseExpression();
        if(this.pos != string.length && this.pos != -1) throw new Error(`Unexpected character at position ${this.pos}`);
        return expr;
    }
    
    // reads the next char (or -1 if end of string)
    nextChar() {
        this.c = (++this.pos < this.string.length) ? this.string.charAt(this.pos) : -1;
    }

    // skips spaces and reads the nextChar if it matches
    eat(charToEat) {
        while(this.c == ' ') this.nextChar();
        if(this.c == charToEat) {
            this.nextChar();
            return true;
        }
        return false;
    }

    // expression = term | expression `+` term | expression `-` term
    parseExpression() {
        var x = this.parseTerm();
        while(true) {
            if(this.eat('+')) {
                // parse sum
                const a = x;
                const b = this.parseTerm();

                x = new Expr(c => {
                    const ar = a.eval(c);
                    const br = b.eval(c);
                    return new Result(ar.v + br.v, ar.s + ' + ' + br.s, ar.drs, br.drs);
                });
            } else if(this.eat('-')) {
                // parse subtraction
                const a = x;
                const b = this.parseTerm();

                x = new Expr(c => {
                    const ar = a.eval(c);
                    const br = b.eval(c);
                    return new Result(ar.v - br.v, ar.s + ' - ' + br.s, ar.drs, br.drs);
                });
            } else {
                return x;
            }
        }
    }

    // term = factor | term `*` factor | term `/` factor
    parseTerm() {
        var x = this.parseFactor();
        while(true) {
            if(this.eat('*')) {
                // parse multiplication
                const a = x;
                const b = this.parseFactor();

                x = new Expr(c => {
                    const ar = a.eval(c);
                    const br = b.eval(c);
                    return new Result(ar.v * br.v, ar.s + ' * ' + br.s, ar.drs, br.drs);
                });
            } else if(this.eat('/')) {
                // parse division
                const a = x;
                const b = this.parseFactor();

                x = new Expr(c => {
                    const ar = a.eval(c);
                    const br = b.eval(c);
                    return new Result(ar.v / br.v, ar.s + ' / ' + br.s, ar.drs, br.drs);
                });
            } else {
                return x;
            }
        }
    }

    // factor = `+` factor | `-` factor | function | value
    parseFactor() {
        // parse signed factor
        if(this.eat('+')) {
            return this.parseFactor();
        }
        if(this.eat('-')) {
            const a = this.parseFactor();
            return new Expr(c => {
                const ar = a.eval(c);
                return new Result(-ar.v, '-'+ar.s, ar.drs);
            });
        }

        // function
        if(isLetter(this.c)) {
            return this.parseFunction();
        }

        // parse value
        return this.parseValue();
    }

    // function = identifier `(` parameters `)`
    parseFunction() {
        const name = this.parseIdentifier();
        if(!this.eat('(')) throw new Error('Expected (');
        const parameters = this.parseParameters();
        if(!this.eat(')')) throw new Error('Expected )');

        // function implementation - might need a better generalized system in the future
        switch(name) {
        case 'min':
            if(parameters.length != 2) throw new Error(`Wrong parameter count for min, 2 expected got ${parameters.length}`);
            return new Expr(c => {
                const r1 = parameters[0].eval(c);
                const r2 = parameters[1].eval(c);
                return new Result(Math.min(r1.v, r2.v), 'min('+r1.s+', '+r2.s+')', r1.drs, r2.drs);
            });
        case 'max':
            if(parameters.length != 2) throw new Error(`Wrong parameter count for max, 2 expected got ${parameters.length}`);
            return new Expr(c => {
                const r1 = parameters[0].eval(c);
                const r2 = parameters[1].eval(c);
                return new Result(Math.max(r1.v, r2.v), 'max('+r1.s+', '+r2.s+')', r1.drs, r2.drs);
            });
        case 'sqrt':
            if(parameters.length != 1) throw new Error(`Wrong parameter count for sqrt, 1 expected got ${parameters.length}`);
            return new Expr(c => {
                const r1 = parameters[0].eval(c);
                return new Result(Math.sqrt(r1.v), 'sqrt('+r1.s+')', r1.drs);
            });
        case 'floor':
            if(parameters.length != 1) throw new Error(`Wrong parameter count for floor, 1 expected got ${parameters.length}`);
            return new Expr(c => {
                const r1 = parameters[0].eval(c);
                return new Result(Math.floor(r1.v), 'floor('+r1.s+')', r1.drs);
            });
        case 'ceil':
            if(parameters.length != 1) throw new Error(`Wrong parameter count for ceil, 1 expected got ${parameters.length}`);
            return new Expr(c => {
                const r1 = parameters[0].eval(c);
                return new Result(Math.ceil(r1.v), 'ceil('+r1.s+')', r1.drs);
            });
        default:
            throw new Error(`Unknown function ${name}`);
        }
    }

    parseIdentifier() {
        var identifier = '';
        while(isLetter(this.c) || isDigit(this.c) || this.c == '_' || this.c == '.') {
            identifier = identifier + this.c;
            this.nextChar();
        }
        return identifier;
    }

    // parameters = expression | parameters `,` expression
    parseParameters() {
        var parameters = [];
        do {
            parameters.push(this.parseExpression());
        } while(this.eat(','));
        return parameters;
    }

    // value = `{` identifier(variable) `}` | `(` expression `)` | number | value 'D/W' dice
    parseValue() {
        var expr = null;

        // {variable}
        if(this.eat('{')) {
            const variableString = this.parseIdentifier();
            if(!this.eat('}')) throw new Error('Unclosed variable parentheses');

            expr = parseVariable(variableString);
        }
        // (expression)
        else if(this.eat('(')) {
            const a = this.parseExpression();
            if(!this.eat(')')) throw new Error('Unclosed parentheses');

            expr = new Expr(c => {
                const ar = a.eval(c);
                return new Result(ar.v, '('+ar.s+')', ar.drs);
            });
        }
        // number
        else {
            expr = this.parseNumber();
        }

        // parse dice if present
        if(this.eat('d') || this.eat('D') || this.eat('w') || this.eat('W')) {
            return this.parseDice(expr);
        } else {
            return expr;
        }
    }

    // dice = value modifiers | value modifiers `[` identifier `]`
    parseDice(count) {
        const sides = this.parseValue();

        const dice = new Dice(count, sides);
        this.parseModifiers(dice);

        // parse label
        if(this.eat('[')) {
            const label = this.parseIdentifier();
            if(!this.eat(']')) throw new Error('Unclosed label');

            dice.setLabel(label);
        }

        return dice;
    }

    // modifiers = modifier*
    parseModifiers(dice) {
        while(this.parseModifier(dice)) {};
    }

    // modifier = `CS` condition | `CF` condition | `R` condition | `RO' condition | `!` | `!O` | `DL` value | `DH` value | `KL` value | `KH` value
    parseModifier(dice) {
        if(this.eat('c') || this.eat('C')) {
            if(this.eat('s') || this.eat('S')) {
				dice.setCriticalSuccessCondition(this.parseCondition());
            } else if(this.eat('f') || this.eat('F')) {
				dice.setCriticalFailureCondition(this.parseCondition());
            } else {
                throw new Error(`Unknown modifier at ${this.pos-1}`);
            }
            return true;
        } else if(this.eat('r') || this.eat('R')) {
            if(this.eat('o') || this.eat('O')) {
				dice.setRerollCondition(this.parseCondition());
				dice.setMaxRerollCount(1);
            } else {
				dice.setRerollCondition(this.parseCondition());
            }
            return true;
        } else if(this.eat('!')) {
            if(this.eat('o') || this.eat('O')) {
				dice.setExplodeDice(true);
				dice.setMaxExplodeCount(1);
            } else {
				dice.setExplodeDice(true);
            }
            return true;
        } else if(this.eat('d') || this.eat('D')) {
            if(this.eat('l') || this.eat('L')) {
				dice.setLowAction(Dice.Action.DROP);
				dice.setLowCount(this.parseValue());
            } else if(this.eat('h') || this.eat('H')) {
				dice.setHighAction(Dice.Action.DROP);
				dice.setHighCount(this.parseValue());
            } else {
                throw new Error(`Unknown modifier at ${this.pos-1}`);
            }
            return true;
        } else if(this.eat('k') || this.eat('K')) {
            if(this.eat('l') || this.eat('L')) {
				dice.setLowAction(Dice.Action.KEEP);
				dice.setLowCount(this.parseValue());
            } else if(this.eat('h') || this.eat('H')) {
				dice.setHighAction(Dice.Action.KEEP);
				dice.setHighCount(this.parseValue());
            } else {
                throw new Error(`Unknown modifier at ${this.pos-1}`);
            }
            return true;
        } else {
            return false;
        }
    }

    // condition = value | `<` value | `<=` value | `>` value | `>=` value
    parseCondition() {
        if(this.eat('<')) {
            if(this.eat('=')) {
                return new Condition(Condition.Type.LESS_THAN_OR_EQUAL, this.parseValue());
            } else {
                return new Condition(Condition.Type.LESS_THAN, this.parseValue());
            }
        } else if(this.eat('>')) {
            if(this.eat('=')) {
                return new Condition(Condition.Type.GREATER_THAN_OR_EQUAL, this.parseValue());
            } else {
                return new Condition(Condition.Type.GREATER_THAN, this.parseValue());
            }
        } else {
            return new Condition(Condition.Type.EQUAL, this.parseValue());
        }
    }

    parseNumber() {
        // find substring
        const startPos = this.pos;
        while(isDigit(this.c) || this.c == '.') this.nextChar();
        if(this.pos == startPos) throw new Error(`Expected number at ${startPos}`);
        const valueString = this.string.substring(startPos, this.pos);
        
        const value = Number(valueString);
        if(isNaN(value)) throw new Error(`Not a praseable number: ${valueString} at ${startPos}`);

        if(_isIntegerExp.test(valueString)) {
            return new Expr(c => new Result(Math.trunc(value), String(Math.trunc(value)), []));
        } else {
            return new Expr(c => new Result(value, String(value), []));
        }
    }
}
export const ParserInstance = new Parser();
