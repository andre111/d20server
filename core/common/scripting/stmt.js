// @ts-check
import { Visitor } from './visitor.js';
import { Expr } from './expr.js';
import { IDENTIFIER, Token } from './token.js';

/**
 * Represents a single statement.
 * @abstract
 */
export class Stmt {
    /**
     * Accept a visitor visiting this statement.
     * Implementations should refer to the correspondig visitor method.
     * @abstract
     * @param {Visitor} visitor the {@link Visitor} object
     */
    accept(visitor) { throw new Error('Cannot call abstract function'); }
}
/**
 * Represents a block of statements.
 */
export class Block extends Stmt {
    #statements;

    /**
     * @param {Stmt[]} statements the contained statements
     */
    constructor(statements) {
        super();
        this.#statements = statements;
    }

    /** the contained statements */
    get statements() {
        return this.#statements;
    }

    /**
     * @override
     * @param {Visitor} visitor 
     */
    accept(visitor) {
        visitor.visitBlock(this);
    }
}
/**
 * Represents a statement consisting of a single expression.
 */
export class ExpressionStmt extends Stmt {
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
        visitor.visitExpressionStmt(this);
    }
}
/**
 * Represents a function declaration.
 */
export class FunctionDeclStmt extends Stmt {
    #name;
    #params;
    #body;

    /**
     * @param {string} name the name of the function
     * @param {string[]} params the function parameters names
     * @param {Stmt[]} body the statements making up the function body
     */
    constructor(name, params, body) {
        super();
        this.#name = name;
        this.#params = params;
        this.#body = body;
    }

    /** the name of the function */
    get name() {
        return this.#name;
    }

    /** the function parameters names */
    get params() {
        return this.#params;
    }

    /** the statements making up the function body */
    get body() {
        return this.#body;
    }

    /**
     * @override
     * @param {Visitor} visitor 
     */
    accept(visitor) {
        visitor.visitFunctionDeclStmt(this);
    }
}
/**
 * Represents an if (else) statement.
 */
export class IfStmt extends Stmt {
    #condition;
    #thenBranch;
    #elseBranch;

    /**
     * @param {Expr} condition the condition expression
     * @param {Stmt} thenBranch the statement making up the then branch
     * @param {Stmt} elseBranch the statement making up the else branch, can be null
     */
    constructor(condition, thenBranch, elseBranch) {
        super();
        this.#condition = condition;
        this.#thenBranch = thenBranch;
        this.#elseBranch = elseBranch;
    }

    /** the condition expression */
    get condition() {
        return this.#condition;
    }

    /** the statement making up the then branch */
    get thenBranch() {
        return this.#thenBranch;
    }

    /** the statement making up the else branch, can be null */
    get elseBranch() {
        return this.#elseBranch;
    }

    /**
     * @override
     * @param {Visitor} visitor 
     */
    accept(visitor) {
        visitor.visitIfStmt(this);
    }
}
/**
 * Represents a return statement.
 */
export class ReturnStmt extends Stmt {
    #keyword;
    #expression;

    /**
     * @param {Token} keyword the return keyword token
     * @param {Expr} expression the return value expression, can be null
     */
    constructor(keyword, expression) {
        super();
        this.#keyword = keyword;
        this.#expression = expression;
    }

    /** the return keyword token */
    get keyword() {
        return this.#keyword;
    }

    /** the return value expression, can be null */
    get expression() {
        return this.#expression;
    }

    /**
     * @override
     * @param {Visitor} visitor 
     */
    accept(visitor) {
        visitor.visitReturnStmt(this);
    }
}
/**
 * Represents a variable declaration.
 */
export class VarDeclStmt extends Stmt {
    #name;
    #initializer;

    /**
     * @param {Token} name the name of the variable
     * @param {Expr} initializer the initialization expression, can be null
     */
    constructor(name, initializer) {
        super();
        this.#name = name;
        this.#initializer = initializer;

        if (name.type != IDENTIFIER) throw new Error('Variable name token needs to be an IDENTIFIER');
    }

    /** the name of the variable */
    get name() {
        return this.#name;
    }

    /** the initialization expression, can be null */
    get initializer() {
        return this.#initializer;
    }

    /**
     * @override
     * @param {Visitor} visitor 
     */
    accept(visitor) {
        visitor.visitVarDeclStmt(this);
    }
}
/**
 * Represents a while statement.
 */
export class WhileStmt extends Stmt {
    #condition;
    #body;

    /**
     * @param {Expr} condition the conditional expression
     * @param {Stmt} body the statement making up the while body
     */
    constructor(condition, body) {
        super();
        this.#condition = condition;
        this.#body = body;
    }

    /** the conditional expression */
    get condition() {
        return this.#condition;
    }

    /** the statement making up the while body */
    get body() {
        return this.#body;
    }

    /**
     * @override
     * @param {Visitor} visitor 
     */
    accept(visitor) {
        visitor.visitWhileStmt(this);
    }
}
