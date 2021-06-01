export class Stmt {
    constructor() {
    }

    accept(visitor) { throw new Error('Cannot call abstract function'); }
}
export class Block extends Stmt {
    #statements;

    constructor(statements) {
        super();
        this.#statements = statements;
    }

    get statements() {
        return this.#statements;
    }

    accept(visitor) {
        visitor.visitBlock(this);
    }
}
export class ExpressionStmt extends Stmt {
    #expression;

    constructor(expression) {
        super();
        this.#expression = expression;
    }

    get expression() {
        return this.#expression;
    }

    accept(visitor) {
        visitor.visitExpressionStmt(this);
    }
}
export class FunctionDeclStmt extends Stmt {
    #name;
    #params;
    #body;

    constructor(name, params, body) {
        super();
        this.#name = name;
        this.#params = params;
        this.#body = body;
    }

    get name() {
        return this.#name;
    }

    get params() {
        return this.#params;
    }

    get body() {
        return this.#body;
    }

    accept(visitor) {
        visitor.visitFunctionDeclStmt(this);
    }
}
export class IfStmt extends Stmt {
    #condition;
    #thenBranch;
    #elseBranch;

    constructor(condition, thenBranch, elseBranch) {
        super();
        this.#condition = condition;
        this.#thenBranch = thenBranch;
        this.#elseBranch = elseBranch;
    }

    get condition() {
        return this.#condition;
    }

    get thenBranch() {
        return this.#thenBranch;
    }

    get elseBranch() {
        return this.#elseBranch;
    }

    accept(visitor) {
        visitor.visitIfStmt(this);
    }
}
export class ReturnStmt extends Stmt {
    #keyword;
    #expression;

    constructor(keyword, expression) {
        super();
        this.#keyword = keyword;
        this.#expression = expression;
    }

    get keyword() {
        return this.#keyword;
    }

    get expression() {
        return this.#expression;
    }

    accept(visitor) {
        visitor.visitReturnStmt(this);
    }
}
export class VarDeclStmt extends Stmt {
    #name;
    #initializer;

    constructor(name, initializer) {
        super();
        this.#name = name;
        this.#initializer = initializer;
    }

    get name() {
        return this.#name;
    }

    get initializer() {
        return this.#initializer;
    }

    accept(visitor) {
        visitor.visitVarDeclStmt(this);
    }
}
export class WhileStmt extends Stmt {
    #condition;
    #body;

    constructor(condition, body) {
        super();
        this.#condition = condition;
        this.#body = body;
    }

    get condition() {
        return this.#condition;
    }

    get body() {
        return this.#body;
    }

    accept(visitor) {
        visitor.visitWhileStmt(this);
    }
}
