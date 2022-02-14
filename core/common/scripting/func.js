import { Type } from '../constants.js';
import { EntityManagers } from '../entity/entity-managers.js';
import { EntityReference } from '../entity/entity-reference.js';
import { RuntimeError } from './runtime-error.js';
import { ScrArray } from './scrarray.js';
import { Value } from './value.js';

export class Func extends Value {
    #arity;

    constructor(arity) {
        super(null, Type.FUNCTION, '<func>');
        this.#arity = arity;
    }

    get value() {
        return this;
    }

    get arity() {
        return this.#arity;
    }

    call(interpreter, paren, name, args) { throw new Error('Cannot call abstract function'); }
}
export class Return {
    #value;

    constructor(value) {
        this.#value = value;
    }

    get value() {
        return this.#value;
    }
}

export function getExprString(name, args) {
    var expr = '';
    for (const argument of args) {
        if (expr) expr = expr + ', ';
        expr = expr + argument.expr;
    }
    expr = name + '(' + expr + ')';
    return expr;
}

// builtins
// "casting"
export const BUILTIN_NUMBER = new Func(1);
BUILTIN_NUMBER.call = (interpreter, paren, name, args) => {
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
};

// math
export const BUILTIN_CEIL = new Func(1);
BUILTIN_CEIL.call = (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.DOUBLE);
    return new Value(Math.ceil(args[0].value), Type.DOUBLE, getExprString(name, args));
};

export const BUILTIN_FLOOR = new Func(1);
BUILTIN_FLOOR.call = (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.DOUBLE);
    return new Value(Math.floor(args[0].value), Type.DOUBLE, getExprString(name, args));
};

export const BUILTIN_MAX = new Func(2);
BUILTIN_MAX.call = (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.DOUBLE);
    interpreter.checkOperandType(paren, args[1], Type.DOUBLE);
    return new Value(Math.max(args[0].value, args[1].value), Type.DOUBLE, getExprString(name, args));
};

export const BUILTIN_MIN = new Func(2);
BUILTIN_MIN.call = (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.DOUBLE);
    interpreter.checkOperandType(paren, args[1], Type.DOUBLE);
    return new Value(Math.min(args[0].value, args[1].value), Type.DOUBLE, getExprString(name, args));
};

export const BUILTIN_SQRT = new Func(1);
BUILTIN_SQRT.call = (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.DOUBLE);
    return new Value(Math.sqrt(args[0].value), Type.DOUBLE, getExprString(name, args));
};

// array (and string)
export const BUILTIN_ARRAY = new Func(0);
BUILTIN_ARRAY.call = (interpreter, paren, name, args) => {
    return new ScrArray();
};

export const BUILTIN_LEN = new Func(1);
BUILTIN_LEN.call = (interpreter, paren, name, args) => {
    switch (args[0].type) {
        case Type.ARRAY:
            return new Value(args[0].value.length, Type.DOUBLE, getExprString(name, args));
        case Type.STRING:
            return new Value(args[0].value.length, Type.DOUBLE, getExprString(name, args));
        default:
            throw new RuntimeError(paren, 'Cannot get length of ' + args[0].type);
    }
};

// entity
export const BUILTIN_FIND = new Func(2);
BUILTIN_FIND.call = (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.STRING);
    interpreter.checkOperandType(paren, args[1], Type.DOUBLE);
    const manager = EntityManagers.get(args[0].value);
    if (manager) {
        const entity = manager.find(Math.trunc(args[1].value));
        if (entity) return new Value(new EntityReference(entity), Type.ENTITY, getExprString(name, args));
    }
    return Value.NULL;
};

export const BUILTIN_LIST = new Func(1);
BUILTIN_LIST.call = (interpreter, paren, name, args) => {
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
};
