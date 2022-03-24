// @ts-check
export class Visitor {
    constructor() {
    }

    visitBlock(block) { throw new Error('Cannot call abstract function'); }
    visitExpressionStmt(stmt) { throw new Error('Cannot call abstract function'); }
    visitFunctionDeclStmt(stmt) { throw new Error('Cannot call abstract function'); }
    visitIfStmt(stmt) { throw new Error('Cannot call abstract function'); }
    visitReturnStmt(stmt) { throw new Error('Cannot call abstract function'); }
    visitVarDeclStmt(stmt) { throw new Error('Cannot call abstract function'); }
    visitWhileStmt(stmt) { throw new Error('Cannot call abstract function'); }

    visitArrayGet(aget) { throw new Error('Cannot call abstract function'); }
    visitArraySet(aset) { throw new Error('Cannot call abstract function'); }
    visitAssignment(assignment) { throw new Error('Cannot call abstract function'); }
    visitBinary(binary) { throw new Error('Cannot call abstract function'); }
    visitCall(call) { throw new Error('Cannot call abstract function'); }
    visitDice(dice) { throw new Error('Cannot call abstract function'); }
    visitGet(get) { throw new Error('Cannot call abstract function'); }
    visitGrouping(grouping) { throw new Error('Cannot call abstract function'); }
    visitLiteral(literal) { throw new Error('Cannot call abstract function'); }
    visitLogical(logical) { throw new Error('Cannot call abstract function'); }
    visitSet(set) { throw new Error('Cannot call abstract function'); }
    visitUnary(unary) { throw new Error('Cannot call abstract function'); }
    visitVariable(variable) { throw new Error('Cannot call abstract function'); }
}
