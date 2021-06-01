export class Expr {
    constructor() {
    }

    accept(visitor) { throw new Error('Cannot call abstract function'); }
}
export class Assignment extends Expr {
    #name;
    #expression;

    constructor(name, expression) {
        super();
        this.#name = name;
        this.#expression = expression;
    }

    get name() {
        return this.#name;
    }

    get expression() {
        return this.#expression;
    }

    accept(visitor) {
        return visitor.visitAssignment(this);
    }
}
export class Binary extends Expr {
    #left;
    #operator;
    #right;

    constructor(left, operator, right) {
        super();
        this.#left = left;
        this.#operator = operator;
        this.#right = right;
    }

    get left() {
        return this.#left;
    }

    get operator() {
        return this.#operator;
    }

    get right() {
        return this.#right;
    }

    accept(visitor) {
        return visitor.visitBinary(this);
    }
}
export class Call extends Expr {
    #callee;
    #paren;
    #args;

    constructor(callee, paren, args) {
        super();
        this.#callee = callee;
        this.#paren = paren;
        this.#args = args;
    }

    get callee() {
        return this.#callee;
    }

    get paren() {
        return this.#paren;
    }

    get args() {
        return this.#args;
    }

    accept(visitor) {
        return visitor.visitCall(this);
    }
}
export class Dice extends Expr {
    #count;
    #token;
    #sides;
    #modifiers;
    #label;

    constructor(count, token, sides, modifiers, label) {
        super();
        this.#count = count;
        this.#token = token;
        this.#sides = sides;
        this.#modifiers = modifiers;
        this.#label = label;
    }

    get count() {
        return this.#count;
    }

    get token() {
        return this.#token;
    }

    get sides() {
        return this.#sides;
    }

    get modifiers() {
        return this.#modifiers;
    }

    get label() {
        return this.#label;
    }

    accept(visitor) {
        return visitor.visitDice(this);
    }
}
export class Get extends Expr {
    #object;
    #name;

    constructor(object, name) {
        super();
        this.#object = object;
        this.#name = name;
    }

    get object() {
        return this.#object;
    }

    get name() {
        return this.#name;
    }

    accept(visitor) {
        return visitor.visitGet(this);
    }
}
export class Grouping extends Expr {
    #expression;

    constructor(expression) {
        super();
        this.#expression = expression;
    }

    get expression() {
        return this.#expression;
    }

    accept(visitor) {
        return visitor.visitGrouping(this);
    }
}
export class Literal extends Expr {
    #value;

    constructor(value) {
        super();
        this.#value = value;
    }

    get value() {
        return this.#value;
    }

    accept(visitor) {
        return visitor.visitLiteral(this);
    }
}
export class Logical extends Expr {
    #left;
    #operator;
    #right;

    constructor(left, operator, right) {
        super();
        this.#left = left;
        this.#operator = operator;
        this.#right = right;
    }

    get left() {
        return this.#left;
    }

    get operator() {
        return this.#operator;
    }

    get right() {
        return this.#right;
    }

    accept(visitor) {
        return visitor.visitLogical(this);
    }
}
export class Set extends Expr {
    #object;
    #name;
    #expression;

    constructor(object, name, expression) {
        super();
        this.#object = object;
        this.#name = name;
        this.#expression = expression;
    }

    get object() {
        return this.#object;
    }

    get name() {
        return this.#name;
    }

    get expression() {
        return this.#expression;
    }

    accept(visitor) {
        return visitor.visitSet(this);
    }
}
export class Unary extends Expr {
    #operator;
    #right;
    
    constructor(operator, right) {
        super();
        this.#operator = operator;
        this.#right = right;
    }

    get operator() {
        return this.#operator;
    }

    get right() {
        return this.#right;
    }

    accept(visitor) {
        return visitor.visitUnary(this);
    }
}
export class Variable extends Expr {
    #name;

    constructor(name) {
        super();
        this.#name = name;
    }

    get name() {
        return this.#name;
    }

    accept(visitor) {
        return visitor.visitVariable(this);
    }
}
