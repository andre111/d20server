// @ts-check
import { ArrayGet, ArraySet, Assignment, Binary, Call, Dice, Get, Grouping, Literal, Logical, Set, Unary, Variable } from './expr.js';
import { Block, ExpressionStmt, FunctionDeclStmt, IfStmt, ReturnStmt, VarDeclStmt, WhileStmt } from './stmt.js';

/**
 * Visitor for traversing an AST.
 * @template T
 */
export class Visitor {
    /**
     * Visit a {@link Block} statement.
     * @abstract
     * @param {Block} block the block to visit
     */
    visitBlock(block) { throw new Error('Cannot call abstract function'); }
    /**
     * Visit an {@link ExpressionStmt}.
     * @abstract
     * @param {ExpressionStmt} stmt the expression statement to visit
     */
    visitExpressionStmt(stmt) { throw new Error('Cannot call abstract function'); }
    /**
     * Visit a {@link FunctionDeclStmt}.
     * @abstract
     * @param {FunctionDeclStmt} stmt the function declaration statement to visit
     */
    visitFunctionDeclStmt(stmt) { throw new Error('Cannot call abstract function'); }
    /**
     * Visit an {@link IfStmt}.
     * @abstract
     * @param {IfStmt} stmt the if statement to visit
     */
    visitIfStmt(stmt) { throw new Error('Cannot call abstract function'); }
    /**
     * Visit a {@link ReturnStmt}.
     * @abstract
     * @param {ReturnStmt} stmt the return statement to visit
     */
    visitReturnStmt(stmt) { throw new Error('Cannot call abstract function'); }
    /**
     * Visit a {@link VarDeclStmt}.
     * @abstract
     * @param {VarDeclStmt} stmt the variable declaration statement to visit
     */
    visitVarDeclStmt(stmt) { throw new Error('Cannot call abstract function'); }
    /**
     * Visit a {@link WhileStmt}.
     * @abstract
     * @param {WhileStmt} stmt the while statement to visit
     */
    visitWhileStmt(stmt) { throw new Error('Cannot call abstract function'); }

    /**
     * Visit an {@link ArrayGet} expression.
     * @abstract
     * @param {ArrayGet} aget the array get expression to visit
     * @returns {T}
     */
    visitArrayGet(aget) { throw new Error('Cannot call abstract function'); }
    /**
     * Visit an {@link ArraySet} expression.
     * @abstract
     * @param {ArraySet} aset the array set expression to visit
     * @returns {T}
     */
    visitArraySet(aset) { throw new Error('Cannot call abstract function'); }
    /**
     * Visit an {@link Assignment} expression.
     * @abstract
     * @param {Assignment} assignment the assignment expression to visit
     * @returns {T}
     */
    visitAssignment(assignment) { throw new Error('Cannot call abstract function'); }
    /**
     * Visit a {@link Binary} expression.
     * @abstract
     * @param {Binary} binary the binary expression to visit
     * @returns {T}
     */
    visitBinary(binary) { throw new Error('Cannot call abstract function'); }
    /**
     * Visit a {@link Call} expression.
     * @abstract
     * @param {Call} call the function call expression to visit
     * @returns {T}
     */
    visitCall(call) { throw new Error('Cannot call abstract function'); }
    /**
     * Visit a {@link Dice} expression.
     * @abstract
     * @param {Dice} dice the dice expression to visit
     * @returns {T}
     */
    visitDice(dice) { throw new Error('Cannot call abstract function'); }
    /**
     * Visit a {@link Get} expression.
     * @abstract
     * @param {Get} get the property get expression to visit
     * @returns {T}
     */
    visitGet(get) { throw new Error('Cannot call abstract function'); }
    /**
     * Visit a {@link Grouping} expression.
     * @abstract
     * @param {Grouping} grouping the grouping expression to visit
     * @returns {T}
     */
    visitGrouping(grouping) { throw new Error('Cannot call abstract function'); }
    /**
     * Visit a {@link Literal}.
     * @abstract
     * @param {Literal} literal the literal to visit
     * @returns {T}
     */
    visitLiteral(literal) { throw new Error('Cannot call abstract function'); }
    /**
     * Visit a {@link Logical} expression.
     * @abstract
     * @param {Logical} logical the logical expression to visit
     * @returns {T}
     */
    visitLogical(logical) { throw new Error('Cannot call abstract function'); }
    /**
     * Visit a {@link Set} expression.
     * @abstract
     * @param {Set} set the property set expression to visit
     * @returns {T}
     */
    visitSet(set) { throw new Error('Cannot call abstract function'); }
    /**
     * Visit an {@link Unary} expression.
     * @abstract
     * @param {Unary} unary the unary expression to visit
     * @returns {T}
     */
    visitUnary(unary) { throw new Error('Cannot call abstract function'); }
    /**
     * Visit a {@link Variable}.
     * @abstract
     * @param {Variable} variable the variable to visit
     * @returns {T}
     */
    visitVariable(variable) { throw new Error('Cannot call abstract function'); }
}
