// @ts-check
import { Type } from '../constants.js';
import { Profile } from '../profile.js';
import { DiceResult } from './dice-result.js';
import { performDiceRolls } from './dice.js';
import { Environment } from './environment.js';
import { ArrayGet, ArraySet, Assignment, Binary, Call, Dice, Expr, Get, Grouping, Literal, Logical, Set, Unary, Variable } from './expr.js';
import { Func, Return } from './func.js';
import { RuntimeError } from './runtime-error.js';
import { Scripting } from './scripting.js';
import { Block, ExpressionStmt, FunctionDeclStmt, IfStmt, ReturnStmt, Stmt, VarDeclStmt, WhileStmt } from './stmt.js';
import { BANG, BANG_EQUAL, EQUAL_EQUAL, GREATER, GREATER_EQUAL, LESS, LESS_EQUAL, MINUS, OR, PLUS, SLASH, STAR, Token } from './token.js';
import { Value } from './value.js';
import { Visitor } from './visitor.js';

/**
 * A Visitor implementation that interprets the passed statements / expressions.
 * Use {@link interpret} or {@link interpretExpression} to start interpretation.
 * @extends {Visitor<Value>}
 */
export class Interpreter extends Visitor {
    #scripting;
    #profile;

    #globals = new Environment();
    #environment = this.#globals;

    /**
     * @param {Scripting} scripting the {@link Scripting} environment
     * @param {Profile} profile the executing {@link Profile}
     */
    constructor(scripting, profile) {
        super();

        this.#scripting = scripting;
        this.#profile = profile;
    }

    /**
     * Sets the global variable to the provided name.
     * @param {string} name the global name to assign to
     * @param {Value} value the value to set
     */
    defineGlobal(name, value) {
        if (!(value instanceof Value)) throw new Error('Provided object is not a scripting value');
        this.#globals.define(name, value);
    }

    /**
     * @returns the executing {@link Profile}
     */
    getProfile() {
        return this.#profile;
    }

    /**
     * Interprets a list of statements.
     * Reports encountered errors to the {@link Scripting} environment.
     * @param {Stmt[]} statements the list of statements to interpret
     */
    interpret(statements) {
        try {
            for (const statement of statements) {
                this.#execute(statement);
            }
        } catch (error) {
            if (error instanceof RuntimeError) {
                this.#scripting.errorToken(error.token, error.message);
            } else {
                throw error;
            }
        }
    }

    /**
     * Interprets a single expression and returns its {@link Value}.
     * Reports encountered errors to the {@link Scripting} environment.
     * @param {Expr} expression the expression to interpret
     * @returns {Value} the resulting value
     */
    interpretExpression(expression) {
        try {
            return this.#evaluate(expression);
        } catch (error) {
            if (error instanceof RuntimeError) {
                this.#scripting.errorToken(error.token, error.message);
            } else {
                throw error;
            }
        }
    }

    // Statements
    /** 
     * @override
     * @param {Block} block the block to visit 
     */
    visitBlock(block) {
        this.executeStatements(block.statements, new Environment(this.#environment));
    }
    /** 
     * @override
     * @param {ExpressionStmt} stmt the expression statement to visit 
     */
    visitExpressionStmt(stmt) {
        this.#evaluate(stmt.expression);
    }
    /** 
     * @override
     * @param {FunctionDeclStmt} stmt the function declaration statement to visit 
     */
    visitFunctionDeclStmt(stmt) {
        const otherEnv = this.#environment;
        const func = new Func(stmt.params.length);
        func.call = (interpreter, paren, name, args) => {
            const env = new Environment(otherEnv);
            for (var i = 0; i < stmt.params.length; i++) {
                env.define(stmt.params[i], args[i]);
            }

            try {
                interpreter.executeStatements(stmt.body, env);
            } catch (ret) {
                if (ret instanceof Return) {
                    return ret.value;
                } else {
                    throw ret;
                }
            }
            return Value.NULL;
        };
        this.#environment.define(stmt.name, func);
    }
    /** 
     * @override
     * @param {IfStmt} stmt the if statement to visit 
     */
    visitIfStmt(stmt) {
        if (this.#evaluate(stmt.condition).isTruthy()) {
            this.#execute(stmt.thenBranch);
        } else if (stmt.elseBranch) {
            this.#execute(stmt.elseBranch);
        }
    }
    /** 
     * @override
     * @param {ReturnStmt} stmt the return statement to visit 
     * @throws {Return} to specify the return value
     */
    visitReturnStmt(stmt) {
        var value = Value.NULL;
        if (stmt.expression) {
            value = this.#evaluate(stmt.expression);
        }

        throw new Return(value);
    }
    /** 
     * @override
     * @param {VarDeclStmt} stmt the variable declaration statement to visit 
     */
    visitVarDeclStmt(stmt) {
        var value = Value.NULL;
        if (stmt.initializer) {
            value = this.#evaluate(stmt.initializer);
        }
        this.#environment.define(stmt.name.lexeme, value);
    }
    /** 
     * @override
     * @param {WhileStmt} stmt the while statement to visit 
     */
    visitWhileStmt(stmt) {
        while (this.#evaluate(stmt.condition).isTruthy()) {
            this.#execute(stmt.body);
        }
    }

    // Expressions
    /** 
     * @override
     * @param {ArrayGet} aget the array get expression to visit 
     * @returns {Value} the evalutated value
     */
    visitArrayGet(aget) {
        const object = this.#evaluate(aget.object);

        const indexV = this.#evaluate(aget.index);
        if (indexV.type != Type.DOUBLE || indexV.value != Math.trunc(indexV.value)) throw new RuntimeError(aget.square, 'Can only index with integers');
        const index = Math.trunc(indexV.value);

        if (object.type == Type.ARRAY) {
            return object.value.get(index);
        } else if (object.type == Type.STRING) {
            if (index < 0 || index >= object.value.length) throw new RuntimeError(aget.square, 'Index out of bounds');

            const c = object.value[index];
            return new Value(c, Type.STRING, `"${c}"`);
        }

        throw new RuntimeError(aget.square, 'Can only perform indexed get on arrays or strings');
    }
    /** 
     * @override
     * @param {ArraySet} aset the array set expression to visit 
     * @returns {Value} the evalutated value
     */
    visitArraySet(aset) {
        const object = this.#evaluate(aset.object);

        const indexV = this.#evaluate(aset.index);
        if (indexV.type != Type.DOUBLE || indexV.value != Math.trunc(indexV.value)) throw new RuntimeError(aset.square, 'Can only index with integers');
        const index = Math.trunc(indexV.value);

        const value = this.#evaluate(aset.expression);

        if (object.type == Type.ARRAY) {
            object.value.set(index, value);
            return value;
        } else if (object.type == Type.STRING) {
            if (index < 0 || index >= object.value.length) throw new RuntimeError(aset.square, 'Index out of bounds');
            if (value.type != Type.STRING || value.value.length != 1) throw new RuntimeError(aset.square, 'Can only set single character on string');

            object.value = object.value.substring(0, index) + value.value + object.value.substring(index + 1, object.value.length);
            return value;
        }

        throw new RuntimeError(aset.square, 'Can only perform indexed set on arrays or strings');
    }
    /** 
     * @override
     * @param {Assignment} assignment the assignment expression to visit 
     * @returns {Value} the evalutated value
     */
    visitAssignment(assignment) {
        const value = this.#evaluate(assignment.expression);
        this.#environment.assign(assignment.name, value);
        return value;
    }
    /** 
     * @override
     * @param {Binary} binary the binary expression to visit 
     * @returns {Value} the evalutated value
     */
    visitBinary(binary) {
        const left = this.#evaluate(binary.left);
        const right = this.#evaluate(binary.right);

        switch (binary.operator.type) {
            case BANG_EQUAL:
                return new Value(!left.isEqual(right), Type.BOOLEAN, left.expr + ' != ' + right.expr);
            case EQUAL_EQUAL:
                return new Value(left.isEqual(right), Type.BOOLEAN, left.expr + ' == ' + right.expr);
            case GREATER:
                this.checkOperandType(binary.operator, left, Type.DOUBLE);
                this.checkOperandType(binary.operator, right, Type.DOUBLE);
                return new Value(left.value > right.value, Type.BOOLEAN, left.expr + ' > ' + right.expr);
            case GREATER_EQUAL:
                this.checkOperandType(binary.operator, left, Type.DOUBLE);
                this.checkOperandType(binary.operator, right, Type.DOUBLE);
                return new Value(left.value >= right.value, Type.BOOLEAN, left.expr + ' >= ' + right.expr);
            case LESS:
                this.checkOperandType(binary.operator, left, Type.DOUBLE);
                this.checkOperandType(binary.operator, right, Type.DOUBLE);
                return new Value(left.value < right.value, Type.BOOLEAN, left.expr + ' < ' + right.expr);
            case LESS_EQUAL:
                this.checkOperandType(binary.operator, left, Type.DOUBLE);
                this.checkOperandType(binary.operator, right, Type.DOUBLE);
                return new Value(left.value <= right.value, Type.BOOLEAN, left.expr + ' <= ' + right.expr);
            case MINUS:
                this.checkOperandType(binary.operator, left, Type.DOUBLE);
                this.checkOperandType(binary.operator, right, Type.DOUBLE);
                return new Value(left.value - right.value, Type.DOUBLE, left.expr + ' - ' + right.expr);
            case PLUS:
                if (left.type == Type.DOUBLE && right.type == Type.DOUBLE) {
                    return new Value(left.value + right.value, Type.DOUBLE, left.expr + ' + ' + right.expr);
                }
                if (left.type == Type.STRING || right.type == Type.STRING) {
                    return new Value(String(left.value) + String(right.value), Type.STRING, left.expr + ' + ' + right.expr);
                }
                throw new RuntimeError(binary.operator, 'Operands must be both numbers or atleast one string');
            case STAR:
                this.checkOperandType(binary.operator, left, Type.DOUBLE);
                this.checkOperandType(binary.operator, right, Type.DOUBLE);
                return new Value(left.value * right.value, Type.DOUBLE, left.expr + ' * ' + right.expr);
            case SLASH:
                this.checkOperandType(binary.operator, left, Type.DOUBLE);
                this.checkOperandType(binary.operator, right, Type.DOUBLE);
                return new Value(left.value / right.value, Type.DOUBLE, left.expr + ' / ' + right.expr);
        }

        throw new Error('Unreachable');
    }
    /** 
     * @override
     * @param {Call} call the function call expression to visit 
     * @returns {Value} the evalutated value
     */
    visitCall(call) {
        const callee = this.#evaluate(call.callee);
        if (callee.type != Type.FUNCTION) throw new RuntimeError(call.paren, 'Can only call functions');
        if (callee.value.arity != call.args.length) throw new RuntimeError(call.paren, 'Expected ' + callee.value.arity + ' arguments but got ' + call.args.length);

        const args = [];
        for (const argument of call.args) {
            args.push(this.#evaluate(argument));
        }

        return callee.value.call(this, call.paren, callee.expr, args);
    }
    /** 
     * @override
     * @param {Dice} dice the dice expression to visit 
     * @returns {Value} the evalutated value
     */
    visitDice(dice) {
        return performDiceRolls(this, dice);
    }
    /** 
     * @override
     * @param {Get} get the property get expression to visit 
     * @returns {Value} the evalutated value
     */
    visitGet(get) {
        const object = this.#evaluate(get.object);
        if (object.type == Type.ENTITY) {
            const entity = object.value;
            const propertyName = get.name.lexeme;

            // check access
            if (!this.#scripting.checkReadAccess(this.#profile, entity, propertyName)) {
                // special case: check property existance
                if (entity && !entity.has(propertyName)) {
                    throw new RuntimeError(get.name, 'Unknown property');
                }

                throw new RuntimeError(get.name, 'Read access denied');
            }

            // special cased getters -> id, manager
            if (propertyName == 'id') {
                return new Value(entity.id, Type.DOUBLE, '{' + entity.id + '}');
            } else if (propertyName == 'manager') {
                return new Value(entity.getManager(), Type.STRING, '"' + entity.getManager() + '"');
            }

            // get type and act accordingly
            var type = entity.getPropertyType(propertyName);
            var value;
            switch (type) {
                case Type.LONG:
                    value = entity.getLong(propertyName);
                    type = Type.DOUBLE;
                    break;
                case Type.DOUBLE:
                    value = entity.getDouble(propertyName);
                    break;
                case Type.STRING:
                    value = entity.getString(propertyName);
                    break;
                case Type.BOOLEAN:
                    value = entity.getBoolean(propertyName);
                    break;
                //TODO: add support for other value types
                default:
                    throw new RuntimeError(get.name, 'Cannot read property of type ' + type);
            }

            return new Value(value, type, '{' + value + '}');
        }

        throw new RuntimeError(get.name, 'Can only get properties on entities');
    }
    /** 
     * @override
     * @param {Grouping} grouping the grouping expression to visit 
     * @returns {Value} the evalutated value
     */
    visitGrouping(grouping) {
        const value = this.#evaluate(grouping.expression);
        return new Value(value.value, value.type, '(' + value.expr + ')');
    }
    /** 
     * @override
     * @param {Literal} literal the literal to visit 
     * @returns {Value} the literal value
     */
    visitLiteral(literal) {
        return literal.value;
    }
    /** 
     * @override
     * @param {Logical} logical the logical expression to visit
     * @returns {Value} the evalutated value
     */
    visitLogical(logical) {
        const left = this.#evaluate(logical.left);

        if (logical.operator.type == OR) {
            if (left.isTruthy()) return left;
        } else {
            if (!left.isTruthy()) return left;
        }

        return this.#evaluate(logical.right);
    }
    /** 
     * @override
     * @param {Set} set the property set expression to visit 
     * @returns {Value} the evalutated value
     */
    visitSet(set) {
        const object = this.#evaluate(set.object);
        if (object.type == Type.ENTITY) {
            const entity = object.value;
            const propertyName = set.name.lexeme;

            // check access
            if (!this.#scripting.checkWriteAccess(this.#profile, entity, propertyName)) {
                // special case: check property existance
                if (entity && !entity.has(propertyName)) {
                    throw new RuntimeError(set.name, 'Unknown property');
                }

                throw new RuntimeError(set.name, 'Write access denied');
            }

            // evaluate value, check type and set
            const value = this.#evaluate(set.expression);
            const type = entity.getPropertyType(propertyName);
            switch (type) {
                case Type.LONG:
                    this.checkOperandType(set.name, value, Type.DOUBLE);
                    entity.setLong(propertyName, Math.trunc(value.value));
                    break;
                case Type.DOUBLE:
                    this.checkOperandType(set.name, value, Type.DOUBLE);
                    entity.setDouble(propertyName, value.value);
                    break;
                case Type.STRING:
                    this.checkOperandType(set.name, value, Type.STRING);
                    entity.setString(propertyName, value.value);
                    break;
                case Type.BOOLEAN:
                    entity.setBoolean(propertyName, value.isTruthy());
                    break;
                //TODO: add support for other value types
                default:
                    throw new RuntimeError(set.name, 'Cannot set property of type ' + type);
            }

            // notify scripting system of entity modification
            this.#scripting.modifiedEntity(entity);

            return value;
        }

        throw new RuntimeError(set.name, 'Can only set properties on entities');
    }
    /** 
     * @override
     * @param {Unary} unary the unary expression to visit 
     * @returns {Value} the evalutated value
     */
    visitUnary(unary) {
        const right = this.#evaluate(unary.right);

        switch (unary.operator.type) {
            case BANG:
                return new Value(!right.isTruthy(), Type.BOOLEAN, '!' + right.expr);
            case MINUS:
                this.checkOperandType(unary.operator, right, Type.DOUBLE);
                return new Value(-right.value, right.type, '-' + right.expr);
            case PLUS:
                this.checkOperandType(unary.operator, right, Type.DOUBLE);
                return new Value(right.value, right.type, '+' + right.expr);
        }

        throw new Error('Unreachable');
    }
    /** 
     * @override
     * @param {Variable} variable the variable to visit
     * @returns {Value} the evalutated value
     */
    visitVariable(variable) {
        const value = this.#environment.get(variable.name);
        return new Value(value.value, value.type, variable.name.lexeme); // this strips the variable expression (to avoid building giant strings in loops)
    }

    // -------------- 
    // helper methods
    // -------------- 

    /**
     * Adds a single dice roll / result to the scripting environment.
     * @param {DiceResult} dr the dice result
     */
    addDiceRoll(dr) { //TODO: this is a wierd 'pass along' method, can this be solved better?
        this.#scripting.addDiceRoll(dr);
    }

    /**
     * Checks if the operand / {@link Value} is of the specified type, otherwise throws a RuntimeError.
     * @param {Token} operator the token used to locate the error
     * @param {Value} operand the operand / {@link Value} to check
     * @param {string} type the expected type, see {@link Type}
     * @throws {RuntimeError} an Error when the operand type does not match the specified type
     */
    checkOperandType(operator, operand, type) {
        if (operand.type == type) return;
        throw new RuntimeError(operator, 'Expected value of type ' + type + ', was ' + operand.type);
    }

    /**
     * Executes to provided statements in the provided environment.
     * Saves and restores the current environment after execution.
     * @param {Stmt[]} statements the statements to execute
     * @param {Environment} environment the environment to use
     */
    executeStatements(statements, environment) {
        const previous = this.#environment;
        try {
            this.#environment = environment;

            for (const statement of statements) {
                this.#execute(statement);
            }
        } finally {
            this.#environment = previous;
        }
    }

    /**
     * Executes the provided statement
     * @param {Stmt} stmt the statement to evaluate
     */
    #execute(stmt) {
        return stmt.accept(this);
    }

    /**
     * Evaluates the provided expression.
     * @param {Expr} expr the expression to evaluate
     * @returns {Value} the evaluated {@link Value}
     */
    #evaluate(expr) {
        return expr.accept(this);
    }
}
