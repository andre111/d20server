// @ts-check
import { Visitor } from './visitor.js';
import { IDENTIFIER, Token } from './token.js';
import { Value } from './value.js';
import { DiceModifier } from './dice-modifier.js';

/**
 * Represents a single expression.
 * @abstract
 */
export class Expr {
    /**
     * Accept a visitor visiting this expression.
     * Implementations should refer to the corresponding visitor method.
     * @abstract
     * @param {Visitor<T>} visitor the {@link Visitor} object
     * @returns {T} the return value of the corresponding visitor method
     * @template T
     */
    accept(visitor) { throw new Error('Cannot call abstract function'); }
}
/**
 * Represents an arrray get operation
 */
export class ArrayGet extends Expr {
    #object;
    #index;
    #square;

    /**
     * @param {Expr} object the expression evaluating to the array object
     * @param {Expr} index the expression evaluating to the index
     * @param {Token} square the token representing the source location
     */
    constructor(object, index, square) {
        super();
        this.#object = object;
        this.#index = index;
        this.#square = square;
    }

    /** the expression evaluating to the array object */
    get object() {
        return this.#object;
    }

    /** the expression evaluating to the index */
    get index() {
        return this.#index;
    }

    /** the token representing the source location */
    get square() {
        return this.#square;
    }

    /**
     * @override
     * @param {Visitor} visitor 
     */
    accept(visitor) {
        return visitor.visitArrayGet(this);
    }
}
/**
 * Represents an array set operation.
 */
export class ArraySet extends Expr {
    #object;
    #index;
    #square;
    #expression;

    /**
     * @param {Expr} object the expression evaluating to the array object
     * @param {Expr} index the expression evaluating to the index
     * @param {Token} square the token representing the source location
     * @param {Expr} expression the expression evaluating to the value to set
     */
    constructor(object, index, square, expression) {
        super();
        this.#object = object;
        this.#index = index;
        this.#square = square;
        this.#expression = expression;
    }

    /** the expression evaluating to the array object */
    get object() {
        return this.#object;
    }

    /** the expression evaluating to the index */
    get index() {
        return this.#index;
    }

    /** the token representing the source location */
    get square() {
        return this.#square;
    }

    /** the expression evaluating to the value to set */
    get expression() {
        return this.#expression;
    }

    /**
     * @override
     * @param {Visitor} visitor 
     */
    accept(visitor) {
        return visitor.visitArraySet(this);
    }
}
/**
 * Represents a variable assignment.
 */
export class Assignment extends Expr {
    #name;
    #expression;

    /**
     * @param {Token} name the variable name
     * @param {Expr} expression the expression evaluating to the value
     */
    constructor(name, expression) {
        super();
        this.#name = name;
        this.#expression = expression;

        if (name.type != IDENTIFIER) throw new Error('Variable name token needs to be an IDENTIFIER');
    }

    /** the variable name */
    get name() {
        return this.#name;
    }

    /** the expression evaluating to the value */
    get expression() {
        return this.#expression;
    }

    /**
     * @override
     * @param {Visitor} visitor 
     */
    accept(visitor) {
        return visitor.visitAssignment(this);
    }
}
/**
 * Represents a binary operation.
 */
export class Binary extends Expr {
    #left;
    #operator;
    #right;

    /**
     * @param {Expr} left the left side expression
     * @param {Token} operator the token representing the operator
     * @param {Expr} right the right side expression
     */
    constructor(left, operator, right) {
        super();
        this.#left = left;
        this.#operator = operator;
        this.#right = right;
    }

    /** the left side expression */
    get left() {
        return this.#left;
    }

    /** the token representing the operator */
    get operator() {
        return this.#operator;
    }

    /** the right side expression */
    get right() {
        return this.#right;
    }

    /**
     * @override
     * @param {Visitor} visitor 
     */
    accept(visitor) {
        return visitor.visitBinary(this);
    }
}
/**
 * Represents a function call.
 */
export class Call extends Expr {
    #callee;
    #paren;
    #args;

    /**
     * @param {Expr} callee the expression evaluating to the function to call
     * @param {Token} paren the token representing the source location
     * @param {Expr[]} args the list of expressions evaluating the the function parameters
     */
    constructor(callee, paren, args) {
        super();
        this.#callee = callee;
        this.#paren = paren;
        this.#args = args;
    }

    /** the expression evaluating to the function to call */
    get callee() {
        return this.#callee;
    }

    /** the token representing the source location */
    get paren() {
        return this.#paren;
    }

    /** the list of expressions evaluating the the function parameters */
    get args() {
        return this.#args;
    }

    /**
     * @override
     * @param {Visitor} visitor 
     */
    accept(visitor) {
        return visitor.visitCall(this);
    }
}
/**
 * Represents a dice throw expression.
 */
export class Dice extends Expr {
    #count;
    #token;
    #sides;
    #modifiers;
    #label;

    /**
     * @param {Expr} count the expression evaluating to the number of dice
     * @param {Token} token the token representing the source location
     * @param {Expr} sides the expression evaluating to the number of sides per die
     * @param {DiceModifier[]} modifiers the list of {@link DiceModifier}s
     * @param {string} label the dice label, can be null
     */
    constructor(count, token, sides, modifiers, label) {
        super();
        this.#count = count;
        this.#token = token;
        this.#sides = sides;
        this.#modifiers = modifiers;
        this.#label = label;
    }

    /** the expression evaluating to the number of dice */
    get count() {
        return this.#count;
    }

    /** the token representing the source location */
    get token() {
        return this.#token;
    }

    /** the expression evaluating to the number of sides per die */
    get sides() {
        return this.#sides;
    }

    /** the list of {@link DiceModifier}s */
    get modifiers() {
        return this.#modifiers;
    }

    /** the dice label, can be null */
    get label() {
        return this.#label;
    }

    /**
     * @override
     * @param {Visitor} visitor 
     */
    accept(visitor) {
        return visitor.visitDice(this);
    }
}
/**
 * Represents an object parameter get operation.
 */
export class Get extends Expr {
    #object;
    #name;

    /**
     * @param {Expr} object the expression evaluating to the object
     * @param {Token} name the name of the property to get
     */
    constructor(object, name) {
        super();
        this.#object = object;
        this.#name = name;

        if (name.type != IDENTIFIER) throw new Error('Property name token needs to be an IDENTIFIER');
    }

    /** the expression evaluating to the object */
    get object() {
        return this.#object;
    }

    /** the name of the property to get */
    get name() {
        return this.#name;
    }

    /**
     * @override
     * @param {Visitor} visitor 
     */
    accept(visitor) {
        return visitor.visitGet(this);
    }
}
/**
 * Represents a grouped (parenthesized) expression.
 */
export class Grouping extends Expr {
    #expression;

    /**
     * @param {Expr} expression the contained expression
     */
    constructor(expression) {
        super();
        this.#expression = expression;
    }

    /** the contained expression */
    get expression() {
        return this.#expression;
    }

    /**
     * @override
     * @param {Visitor} visitor 
     */
    accept(visitor) {
        return visitor.visitGrouping(this);
    }
}
/**
 * Represents a literal value.
 */
export class Literal extends Expr {
    #value;

    /**
     * @param {Value} value the value
     */
    constructor(value) {
        super();
        this.#value = value;
    }

    /** the value */
    get value() {
        return this.#value;
    }

    /**
     * @override
     * @param {Visitor} visitor 
     */
    accept(visitor) {
        return visitor.visitLiteral(this);
    }
}
/**
 * Represents a binary logical comparison.
 */
export class Logical extends Expr {
    #left;
    #operator;
    #right;

    /**
     * @param {Expr} left the left side expression
     * @param {Token} operator the token representing the operator
     * @param {Expr} right the right side expression
     */
    constructor(left, operator, right) {
        super();
        this.#left = left;
        this.#operator = operator;
        this.#right = right;
    }

    /** the left side expression */
    get left() {
        return this.#left;
    }

    /** the token representing the operator */
    get operator() {
        return this.#operator;
    }

    /** the right side expression */
    get right() {
        return this.#right;
    }

    /**
     * @override
     * @param {Visitor} visitor 
     */
    accept(visitor) {
        return visitor.visitLogical(this);
    }
}
/**
 * Represents an object parameter set operation.
 */
export class Set extends Expr {
    #object;
    #name;
    #expression;

    /**
     * @param {Expr} object the expression evaluating to the object
     * @param {Token} name the name of the property to get
     * @param {Expr} expression the expression evaluating to the value
     */
    constructor(object, name, expression) {
        super();
        this.#object = object;
        this.#name = name;
        this.#expression = expression;

        if (name.type != IDENTIFIER) throw new Error('Variable name token needs to be an IDENTIFIER');
    }

    /** the expression evaluating to the object */
    get object() {
        return this.#object;
    }

    /** the name of the property to get */
    get name() {
        return this.#name;
    }

    /** the expression evaluating to the value */
    get expression() {
        return this.#expression;
    }

    /**
     * @override
     * @param {Visitor} visitor 
     */
    accept(visitor) {
        return visitor.visitSet(this);
    }
}
/**
 * Represents an unary operation.
 */
export class Unary extends Expr {
    #operator;
    #right;

    /**
     * @param {Token} operator the token representing the operator
     * @param {Expr} right the right side expression
     */
    constructor(operator, right) {
        super();
        this.#operator = operator;
        this.#right = right;
    }

    /** the token representing the operator */
    get operator() {
        return this.#operator;
    }

    /** the right side expression */
    get right() {
        return this.#right;
    }

    /**
     * @override
     * @param {Visitor} visitor 
     */
    accept(visitor) {
        return visitor.visitUnary(this);
    }
}
/**
 * Represents a variable access.
 */
export class Variable extends Expr {
    #name;

    /**
     * @param {Token} name the variable name
     */
    constructor(name) {
        super();
        this.#name = name;

        if (name.type != IDENTIFIER) throw new Error('Variable name token needs to be an IDENTIFIER');
    }

    /** the variable name */
    get name() {
        return this.#name;
    }

    /**
     * @override
     * @param {Visitor} visitor 
     */
    accept(visitor) {
        return visitor.visitVariable(this);
    }
}
