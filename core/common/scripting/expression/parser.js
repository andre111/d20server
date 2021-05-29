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
// term = dice | term `*` dice | term `/` dice
// dice = factor | dice 'd' factor modifiers
// factor = `+` factor | `-` factor | value
// value = `{` identifier(variable) `}` | `(` expression `)` | function | number

// function = identifier `(` parameters `)`
// parameters = expression | parameters `,` expression

// modifiers = modifier* | modifier* `[` identifier `]`
// modifier = `cs` condition | `cf` condition | `r` condition | `ro` condition | `!` | `!o` | `dl` value | `dh` value | `kl` value | `kh` value
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

    // skips spaces and reads the nextChar(s) if it matches
    eat(charsToEat) {
        while(this.c == ' ') this.nextChar();
        if(this.pos + charsToEat.length > this.string.length) return false;
        
        if(this.string.substring(this.pos, this.pos + charsToEat.length) == charsToEat) {
            this.pos += charsToEat.length - 1;
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

    // term = dice | term `*` dice | term `/` dice
    parseTerm() {
        var x = this.parseDice();
        while(true) {
            if(this.eat('*')) {
                // parse multiplication
                const a = x;
                const b = this.parseDice();

                x = new Expr(c => {
                    const ar = a.eval(c);
                    const br = b.eval(c);
                    return new Result(ar.v * br.v, ar.s + ' * ' + br.s, ar.drs, br.drs);
                });
            } else if(this.eat('/')) {
                // parse division
                const a = x;
                const b = this.parseDice();

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

    // dice = factor | dice 'd' factor modifiers
    parseDice() {
        var x = this.parseFactor();
        while(true) {
            if(this.eat('d') || this.eat('D') || this.eat('w') || this.eat('W')) {
                const count = x;
                const sides = this.parseFactor();
                
                const dice = new Dice(count, sides);
                this.parseModifiers(dice);

                x = dice;
            } else {
                return x;
            }
        }
    }

    // factor = `+` factor | `-` factor | value
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

        // parse value
        return this.parseValue();
    }

    // value = `{` identifier(variable) `}` | `(` expression `)` | function | number
    parseValue() {
        // {variable}
        if(this.eat('{')) {
            const variableString = this.parseIdentifier();
            if(!this.eat('}')) throw new Error('Unclosed variable parentheses');

            return parseVariable(variableString);
        }
        // (expression)
        else if(this.eat('(')) {
            const a = this.parseExpression();
            if(!this.eat(')')) throw new Error('Unclosed parentheses');

            return new Expr(c => {
                const ar = a.eval(c);
                return new Result(ar.v, '('+ar.s+')', ar.drs);
            });
        }
        // function
        else if(isLetter(this.c)) {
            return this.parseFunction();
        }
        // number
        else {
            return this.parseNumber();
        }
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

    // modifiers = modifier* | modifier* `[` identifier `]`
    parseModifiers(dice) {
        while(this.parseModifier(dice)) {};
        
        // parse label
        if(this.eat('[')) {
            const label = this.parseIdentifier();
            if(!this.eat(']')) throw new Error('Unclosed label');

            dice.setLabel(label);
        }
    }

    // modifier = `cs` condition | `cf` condition | `r` condition | `ro` condition | `!` | `!o` | `dl` value | `dh` value | `kl` value | `kh` value
    parseModifier(dice) {
        if(this.eat('cs')) {
            dice.setCriticalSuccessCondition(this.parseCondition());
        } else if(this.eat('cf')) {
            dice.setCriticalFailureCondition(this.parseCondition());
        } else if(this.eat('r')) {
            dice.setRerollCondition(this.parseCondition());
            if(this.eat('o')) dice.setMaxRerollCount(1);
        } else if(this.eat('!')) {
            dice.setExplodeDice(true);
            if(this.eat('o')) dice.setMaxExplodeCount(1);
        } else if(this.eat('dl')) {
            dice.setLowAction(Dice.Action.DROP);
            dice.setLowCount(this.parseValue());
        } else if(this.eat('dh')) {
            dice.setHighAction(Dice.Action.DROP);
            dice.setHighCount(this.parseValue());
        } else if(this.eat('kl')) {
            dice.setLowAction(Dice.Action.KEEP);
            dice.setLowCount(this.parseValue());
        } else if(this.eat('kh')) {
            dice.setHighAction(Dice.Action.KEEP);
            dice.setHighCount(this.parseValue());
        } else {
            return false;
        }

        return true;
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
