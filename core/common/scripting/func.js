// @ts-check
import { Type } from '../constants.js';
import { EntityManagers } from '../entity/entity-managers.js';
import { EntityReference } from '../entity/entity-reference.js';
import { Interpreter } from './interpreter.js';
import { RuntimeError } from './runtime-error.js';
import { ScrArray } from './scrarray.js';
import { Token } from './token.js';
import { Value } from './value.js';

/**
 * Defines a function.
 */
export class Func extends Value {
    #arity;

    /**
     * @param {number} arity the number of parameters
     */
    constructor(arity) {
        super(null, Type.FUNCTION, '<func>');
        this.#arity = arity;
    }

    get value() {
        return this;
    }

    /** the number of parameters */
    get arity() {
        return this.#arity;
    }

    /**
     * Implements the function call.
     * @abstract
     * @param {Interpreter} interpreter the interpreter to use
     * @param {Token} paren to openen parenthesis token used to locate errors
     * @param {string} name the name of the function
     * @param {Value[]} args the passed arguments, number will match the defined {@link arity}
     * @returns {Value}
     */
    call(interpreter, paren, name, args) { throw new Error('Cannot call abstract function'); }
}
/**
 * Stores a return value.
 * Will be thrown to exit a function.
 */
export class Return {
    #value;

    /**
     * @param {Value} value the returned value
     */
    constructor(value) {
        this.#value = value;
    }

    /** the returned value */
    get value() {
        return this.#value;
    }
}

/**
 * Builds a string representing the full function call expression.
 * @param {string} name the function name
 * @param {Value[]} args the arguments passed to the function
 * @returns {string} the final string
 */
export function getExprString(name, args) {
    var expr = '';
    for (const argument of args) {
        if (expr) expr = expr + ', ';
        expr = expr + argument.expr;
    }
    expr = name + '(' + expr + ')';
    return expr;
}

/**
 * Defines a builtin function.
 * @param {number} arity the number of arguments
 * @param {(interpreter: Interpreter, paren: Token, name: string, args: Value[]) => Value} callFn the call function implementation
 */
export function defineBuiltinFunc(arity, callFn) {
    const func = new Func(arity);
    func.call = callFn;
    return func;
}

// builtins
// "casting"
export const BUILTIN_NUMBER = defineBuiltinFunc(1, (interpreter, paren, name, args) => {
    var value = 0;
    switch (args[0].type) {
        case Type.DOUBLE:
            value = args[0].value;
            break;
        case Type.BOOLEAN:
            value = args[0].value ? 1 : 0;
            break;
        case Type.STRING:
            value = parseFloat(args[0].value);
            if (isNaN(value)) throw new RuntimeError(paren, 'Cannot convert "' + args[0].value + '" to number');
            break;
        default:
            throw new RuntimeError(paren, 'Cannot convert ' + args[0].type + ' to number');
    }
    return new Value(value, Type.DOUBLE, getExprString(name, args));
});

// math
export const BUILTIN_CEIL = defineBuiltinFunc(1, (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.DOUBLE);
    return new Value(Math.ceil(args[0].value), Type.DOUBLE, getExprString(name, args));
});

export const BUILTIN_FLOOR = defineBuiltinFunc(1, (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.DOUBLE);
    return new Value(Math.floor(args[0].value), Type.DOUBLE, getExprString(name, args));
});

export const BUILTIN_MAX = defineBuiltinFunc(2, (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.DOUBLE);
    interpreter.checkOperandType(paren, args[1], Type.DOUBLE);
    return new Value(Math.max(args[0].value, args[1].value), Type.DOUBLE, getExprString(name, args));
});

export const BUILTIN_MIN = defineBuiltinFunc(2, (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.DOUBLE);
    interpreter.checkOperandType(paren, args[1], Type.DOUBLE);
    return new Value(Math.min(args[0].value, args[1].value), Type.DOUBLE, getExprString(name, args));
});

export const BUILTIN_SQRT = defineBuiltinFunc(1, (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.DOUBLE);
    return new Value(Math.sqrt(args[0].value), Type.DOUBLE, getExprString(name, args));
});

// array (and string)
export const BUILTIN_ARRAY = defineBuiltinFunc(0, (interpreter, paren, name, args) => {
    return new ScrArray();
});

export const BUILTIN_LEN = defineBuiltinFunc(1, (interpreter, paren, name, args) => {
    switch (args[0].type) {
        case Type.ARRAY:
            return new Value(args[0].value.length, Type.DOUBLE, getExprString(name, args));
        case Type.STRING:
            return new Value(args[0].value.length, Type.DOUBLE, getExprString(name, args));
        default:
            throw new RuntimeError(paren, 'Cannot get length of ' + args[0].type);
    }
});

// entity
export const BUILTIN_FIND = defineBuiltinFunc(2, (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.STRING);
    interpreter.checkOperandType(paren, args[1], Type.DOUBLE);
    const manager = EntityManagers.get(args[0].value);
    if (manager) {
        const entity = manager.find(Math.trunc(args[1].value));
        if (entity) return new Value(new EntityReference(entity), Type.ENTITY, getExprString(name, args));
    }
    return Value.NULL;
});

export const BUILTIN_LIST = defineBuiltinFunc(1, (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.STRING);
    const manager = EntityManagers.get(args[0].value);
    if (manager) {
        const array = new ScrArray();
        var index = 0;
        for (const entity of manager.all()) {
            array.set(index, new Value(new EntityReference(entity), Type.ENTITY, ''));
            index++;
        }
        return array;
    }
    return Value.NULL;
});
