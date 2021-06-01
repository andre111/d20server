import { Type } from '../constants.js';
import { performDiceRolls } from './dice.js';
import { Environment } from './environment.js';
import { Func, Return } from './func.js';
import { RuntimeError } from './runtime-error.js';
import { BANG, BANG_EQUAL, EQUAL_EQUAL, GREATER, GREATER_EQUAL, LESS, LESS_EQUAL, MINUS, OR, PLUS, SLASH, STAR } from './token.js';
import { Value } from './value.js';
import { Visitor } from './visitor.js';

export class Interpreter extends Visitor {
    #scripting;
    #profile;

    #globals = new Environment();
    #environment = this.#globals;
    
    constructor(scripting, profile) {
        super();

        this.#scripting = scripting;
        this.#profile = profile;
    }

    defineGlobal(name, value) {
        if(!(value instanceof Value)) throw new Error('Provided object is not a scripting value');
        this.#globals.define(name, value);
    }

    interpret(statements) {
        try {
            for(const statement of statements) {
                this.#execute(statement);
            }
        } catch(error) {
            if(error instanceof RuntimeError) {
                this.#scripting.errorToken(error.token, error.message);
            } else {
                throw error;
            }
        }
    }

    interpretExpression(expression) {
        try {
            return this.#evaluate(expression);
        } catch(error) {
            if(error instanceof RuntimeError) {
                this.#scripting.errorToken(error.token, error.message);
            } else {
                throw error;
            }
        }
    }

    // Statements
    visitBlock(block) {
        this.executeStatements(block.statements, new Environment(this.#environment));
    }
    visitExpressionStmt(stmt) {
        this.#evaluate(stmt.expression);
    }
    visitFunctionDeclStmt(stmt) { 
        const otherEnv = this.#environment;
        const func = new Func(stmt.params.length);
        func.call = (interpreter, paren, name, args) => {
            const env = new Environment(otherEnv);
            for(var i = 0; i < stmt.params.length; i++) {
                env.define(stmt.params[i].lexeme, args[i]);
            }

            try {
                interpreter.executeStatements(stmt.body, env);
            } catch(ret) {
                if(ret instanceof Return) {
                    return ret.value;
                } else {
                    throw ret;
                }
            }
            return Value.NULL;
        };
        this.#environment.define(stmt.name.lexeme, func);
    }
    visitIfStmt(stmt) {
        if(this.#evaluate(stmt.condition).isTruthy()) {
            this.#execute(stmt.thenBranch);
        } else if(stmt.elseBranch) {
            this.#execute(stmt.elseBranch);
        }
    }
    visitReturnStmt(stmt) {
        var value = Value.NULL;
        if(stmt.expression) {
            value = this.#evaluate(stmt.expression);
        }

        throw new Return(value);
    }
    visitVarDeclStmt(stmt) {
        var value = Value.NULL;
        if(stmt.initializer) {
            value = this.#evaluate(stmt.initializer);
        }
        this.#environment.define(stmt.name.lexeme, value);
    }
    visitWhileStmt(stmt) {
        while(this.#evaluate(stmt.condition).isTruthy()) {
            this.#execute(stmt.body);
        }
    }

    // Expressions
    visitAssignment(assignment) { 
        const value = this.#evaluate(assignment.expression);
        this.#environment.assign(assignment.name, value);
        return value;
    }
    visitBinary(binary) {
        const left = this.#evaluate(binary.left);
        const right = this.#evaluate(binary.right);

        switch(binary.operator.type) {
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
            return new Value(left.vlue < right.value, Type.BOOLEAN, left.expr + ' < ' + right.expr);
        case LESS_EQUAL:
            this.checkOperandType(binary.operator, left, Type.DOUBLE);
            this.checkOperandType(binary.operator, right, Type.DOUBLE);
            return new Value(left.value <= right.value, Type.BOOLEAN, left.expr + ' <= ' + right.expr);
        case MINUS:
            this.checkOperandType(binary.operator, left, Type.DOUBLE);
            this.checkOperandType(binary.operator, right, Type.DOUBLE);
            return new Value(left.value - right.value, Type.DOUBLE, left.expr + ' - ' + right.expr);
        case PLUS:
            if(left.type == Type.DOUBLE && right.type == Type.DOUBLE) {
                return new Value(left.value + right.value, Type.DOUBLE, left.expr + ' + ' + right.expr);
            }
            if(left.type == Type.STRING || right.type == Type.STRING) {
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
    visitCall(call) {
        const callee = this.#evaluate(call.callee);
        if(callee.type != Type.FUNCTION) throw new RuntimeError(call.paren, 'Can only call functions');
        if(callee.value.arity != call.args.length) throw new RuntimeError(call.paren, 'Expected '+callee.value.arity+' arguments but got '+call.args.length);

        const args = [];
        for(const argument of call.args) {
            args.push(this.#evaluate(argument));
        }

        return callee.value.call(this, call.paren, callee.expr, args);
    }
    visitDice(dice) { 
        return performDiceRolls(this, dice);
    }
    visitGet(get) {
        const object = this.#evaluate(get.object);
        if(object.type == Type.ENTITY) {
            const entity = object.value;
            const propertyName = get.name.lexeme;

            // check access
            if(!this.#scripting.checkReadAccess(this.#profile, entity, propertyName)) {
                throw new RuntimeError(get.name, 'Read access denied');
            }

            // special cased getters -> id, manager
            if(propertyName == 'id') {
                return new Value(entity.id, Type.DOUBLE, '{' + entity.id + '}');
            } else if(propertyName == 'manager') {
                return new Value(entity.getManager(), Type.STRING, '"' + entity.getManager() + '"');
            }

            // get type and act accordingly
            var type = entity.getPropertyType(propertyName);
            var value;
            switch(type) {
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
                throw new RuntimeError(get.name, 'Cannot read property of type '+type);
            }

            return new Value(value, type, '{' + value + '}');
        }

        throw new RuntimeError(get.name, 'Can only get properties on entities');
    }
    visitGrouping(grouping) {
        const value = this.#evaluate(grouping.expression);
        return new Value(value.value, value.type, '( ' + value.expr + ' )');
    }
    visitLiteral(literal) { 
        return literal.value;
    }
    visitLogical(logical) {
        const left = this.#evaluate(logical.left);

        if(logical.operator.type == OR) {
            if(left.isTruthy()) return left;
        } else {
            if(!left.isTruthy()) return left;
        }

        return this.#evaluate(logical.right);
    }
    visitSet(set) {
        const object = this.#evaluate(set.object);
        if(object.type == Type.ENTITY) {
            const entity = object.value;
            const propertyName = set.name.lexeme;

            // check access
            if(!this.#scripting.checkReadAccess(this.#profile, entity, propertyName)) {
                throw new RuntimeError(set.name, 'Read access denied');
            }

            // evaluate value, check type and set
            const value = this.#evaluate(set.expression);
            const type = entity.getPropertyType(propertyName);
            switch(type) {
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
                throw new RuntimeError(get.name, 'Cannot set property of type '+type);
            }

            //TODO: should this always directly apply changes or only somehow at the end of the script?
            if(this.#scripting.applyEntityChanges) {
                entity.performUpdate(true);
            }

            return value;
        }
        
        throw new RuntimeError(set.name, 'Can only set properties on entities');
    }
    visitUnary(unary) {
        const right = this.#evaluate(unary.right);

        switch(unary.operator.type) {
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
    visitVariable(variable) {
        const value = this.#environment.get(variable.name);
        return new Value(value.value, value.type, variable.name.lexeme); // this strips the variable expression (to avoid building giant strings in loops)
    }

    // helper methods
    addDiceRoll(dr) {
        this.#scripting.addDiceRoll(dr);
    }

    checkOperandType(operator, operand, type) {
        if(operand.type == type) return;
        throw new RuntimeError(operator, 'Expected value of type '+type+', was '+operand.type);
    }

    executeStatements(statements, environment) {
        const previous = this.#environment;
        try {
            this.#environment = environment;

            for(const statement of statements) {
                this.#execute(statement);
            }
        } finally {
            this.#environment = previous;
        }
    }

    #execute(stmt) {
        return stmt.accept(this);
    }

    #evaluate(expr) {
        return expr.accept(this);
    }
}
