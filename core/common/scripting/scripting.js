// @ts-check
import { Type } from '../constants.js';
import { EntityManagers } from '../entity/entity-managers.js';
import { EntityReference } from '../entity/entity-reference.js';
import { Entity } from '../entity/entity.js';
import { Events } from '../events.js';
import { Profile } from '../profile.js';
import { isString } from '../util/stringutil.js';
import { TokenUtil } from '../util/tokenutil.js';
import { DiceResult } from './dice-result.js';
import { Expr } from './expr.js';
import { BUILTIN_ARRAY, BUILTIN_CEIL, BUILTIN_FIND, BUILTIN_FLOOR, BUILTIN_LEN, BUILTIN_LIST, BUILTIN_MAX, BUILTIN_MIN, BUILTIN_NUMBER, BUILTIN_SQRT, defineBuiltinFunc } from './func.js';
import { Interpreter } from './interpreter.js';
import { Parser } from './parser.js';
import { Scanner } from './scanner.js';
import { Stmt } from './stmt.js';
import { COMMENT, NEWLINE, Token, UNKNOWN, WHITESPACE } from './token.js';
import { Value } from './value.js';

// see: craftinginterpreters.com
// possible syntactic sugar to add: +=, -=, *=, /=, for loops

/**
 * A scripting environment for parsing and executing the custom scripting language defined in D20Server.
 * See {@link interpret} and {@link interpretExpression} for starting points.
 */
export class Scripting {
    /** @type {string[]} */
    #lines;
    /** @type {string[]} */
    #errors;
    /** @type {DiceResult[]} */
    #diceRolls;

    /** @type {Set<EntityReference>} */
    #modifiedEntities;
    /** @type {Object<string, Value[]>} */
    #globalVars;

    #applyEntityChanges;
    #logErrors;

    /**
     * @param {boolean} applyEntityChanges specifies whether entity changes should be applyied after successfull execution, default true
     * @param {boolean} logErrors if true errors are logged to console in addition to providing them as a property, default true
     */
    constructor(applyEntityChanges = true, logErrors = true) {
        this.#modifiedEntities = new Set();
        this.#globalVars = {};

        this.#applyEntityChanges = applyEntityChanges;
        this.#logErrors = logErrors;
    }

    // Global Vars
    //---------------------------------------------------------------
    /**
     * Pushes a named global variable.
     * Potentially replaced older value can later be restored by calling {@link popVariable}.
     * @param {string} name the variable name
     * @param {Value} value the value to set it to
     */
    pushVariable(name, value) {
        if (!isString(name)) throw new Error('name is not a string');
        if (!(value instanceof Value)) throw new Error('value is not an instance of Value');

        if (!this.#globalVars[name]) this.#globalVars[name] = [];
        this.#globalVars[name].push(value);
    }

    /**
     * Pops a named global variable, restoring an earlier value.
     * If no earlier value exists, the global variable definition is removed.
     * @param {string} name the variable name
     */
    popVariable(name) {
        if (!this.#globalVars[name]) return;
        this.#globalVars[name].pop();
        if (this.#globalVars[name].length == 0) delete this.#globalVars[name];
    }


    // Programs
    //---------------------------------------------------------------
    /**
     * Parses and interprets the provided programm source.
     * See {@link errors} and {@link throwIfErrored} to check for potential errors during execution.
     * Resets stored errors before operation.
     * @param {string} source the source code
     * @param {Profile} profile the executing profile, may be null for system level operation, default null
     * @param {Entity} self the Entity or EntityReference representing the 'self' entity
     * @param {(interpreter: Interpreter) => void} interpreterCallback callback called with the {@link Interpreter} object before interpretation
     */
    interpret(source, profile = null, self = null, interpreterCallback = null) {
        const program = this.parse(source);
        this.execute(program, profile, self, interpreterCallback);
    }

    /**
     * Parses a program and returns a cached version that can be executed using {@link execute}.
     * Resets stored errors and dice rolls before operation.
     * @param {string} source the source code
     * @returns {CachedProgram} the parsed and cached program
     */
    parse(source) {
        return {
            statements: this.#createParser(source).parseProgram(),
            lines: this.#lines,
            errors: this.#errors
        };
    }

    /**
     * Executes a previously parsed program.
     * Resets stored errors and dice rolls before operation, keeping the ones from the cached program object.
     * @param {CachedProgram} program the cached program, created by {@link parse}
     * @param {Profile} profile the executing profile, may be null for system level operation, default null
     * @param {Entity} self the Entity or EntityReference representing the 'self' entity
     * @param {(interpreter: Interpreter) => void} interpreterCallback callback called with the {@link Interpreter} object before interpretation
     */
    execute(program, profile = null, self = null, interpreterCallback = null) {
        // reset state
        this.#errors = [];
        this.#diceRolls = [];
        this.#modifiedEntities.clear();
        this.#lines = program.lines;

        // check for parse errors
        if (program.errors.length != 0) {
            this.#errors = program.errors;
            return;
        }

        // run interpreter
        const interpreter = this.#createInterpreter(profile, self);
        if (interpreterCallback) interpreterCallback(interpreter);
        interpreter.interpret(program.statements);

        // update entities
        if (this.#applyEntityChanges) {
            for (const modifiedEntity of this.#modifiedEntities) {
                modifiedEntity.performUpdate();
            }
        }
    }

    // Expressions
    //---------------------------------------------------------------
    /**
     * Parses and interprets the provided expression.
     * Resets stored errors and dice rolls before operation.
     * @param {string} source the expression
     * @param {Profile} profile the executing profile, may be null for system level operation, default null
     * @param {Entity} self the Entity or EntityReference representing the 'self' entity
     * @param {(interpreter: Interpreter) => void} interpreterCallback callback called with the {@link Interpreter} object before interpretation
     * @returns {Value} the resulting {@link Value} on successful execution, or null if any errors have been encountered, see {@link errors} and {@link throwIfErrored}
     */
    interpretExpression(source, profile = null, self = null, interpreterCallback = null) {
        const expression = this.parseExpression(source);
        return this.evalExpression(expression, profile, self, interpreterCallback);
    }

    /**
     * Parses an expression and returns a cached version that can be evalutated using {@link evalExpression}.
     * @param {string} source the source code
     * @returns {CachedExpression} the parsed and cached expression
     */
    parseExpression(source) {
        return {
            expr: this.#createParser(source).parseExpression(),
            lines: this.#lines,
            errors: this.#errors
        };
    }

    /**
     * Evaluates a previously parsed expression.
     * Resets stored errors and dice rolls before operation, keeping the ones from the cached expression object.
     * @param {CachedExpression} expression the cached expression, created by {@link parseExpression}
     * @param {Profile} profile the executing profile, may be null for system level operation, default null
     * @param {Entity} self the Entity or EntityReference representing the 'self' entity
     * @param {(interpreter: Interpreter) => void} interpreterCallback callback called with the {@link Interpreter} object before interpretation
     */
    evalExpression(expression, profile = null, self = null, interpreterCallback = null) {
        // reset state
        this.#errors = [];
        this.#diceRolls = [];
        this.#modifiedEntities.clear();
        this.#lines = expression.lines;

        // check for parse errors
        if (expression.errors.length != 0) {
            this.#errors = expression.errors;
            return;
        }

        // run interpreter
        const interpreter = this.#createInterpreter(profile, self);
        if (interpreterCallback) interpreterCallback(interpreter);
        const result = interpreter.interpretExpression(expression.expr);

        // update entities
        if (this.#applyEntityChanges) {
            for (const modifiedEntity of this.#modifiedEntities) {
                modifiedEntity.performUpdate();
            }
        }

        return result;
    }

    //---------------------------------------------------------------
    /**
     * Splits the provided source string into a list of {@link Token}s.
     * Optionally keeping unknown/whitespace/uninterpreted tokens and performing a full parse for error detection.
     * Resets stored errors before operation.
     * @param {string} source the source string
     * @param {boolean} keepAll should unknown/whitespace/uninterpreted tokens be kept in the array, default false
     * @param {boolean} fullparse should the programm be fully parsed to detect further syntax errors, default false
     * @returns {Token[]} the array of tokens.
     */
    tokenize(source, keepAll = false, fullparse = false) {
        this.#lines = source.split('\n');
        this.#errors = [];
        const tokens = new Scanner(this, source, keepAll).tokens;
        if (fullparse) {
            // perform full parse for error detection (TODO: needs some better way to skip the otherwise not included tokens)
            new Parser(this, tokens.filter(t => (t.type != UNKNOWN && t.type != COMMENT && t.type != WHITESPACE && t.type != NEWLINE))).parseProgram();
        }
        return tokens;
    }

    //---------------------------------------------------------------
    /** the array of {@link DiceResult}s collected during the most recent interpretation operation */
    get diceRolls() {
        return this.#diceRolls;
    }

    /** the array of errors encountered during the most recent parsing or interpretation operation */
    get errors() {
        return this.#errors;
    }

    /**
     * @throws an Error if any problem has been encountered during parsing or interpretation.
     */
    throwIfErrored() {
        if (this.#errors.length != 0) {
            throw new Error(this.#errors.join('\n'));
        }
    }

    /**
     * Creates a {@link Parser} from the specified source.
     * Resets current errors and dice rolls before scanning the source.
     * @param {string} source the script source
     * @returns {Parser} the created parser
     */
    #createParser(source) {
        this.#lines = source.split('\n');
        this.#errors = [];
        this.#diceRolls = [];

        // scan and parse
        const scanner = new Scanner(this, source);
        return new Parser(this, scanner.tokens);
    }

    /**
     * Creates and initializes an interpreter.
     * Defines global functions, player/self/sToken/sActor/... and other global variables.
     * Afterwards defines the global variables as specified in the scripting environment, potentially overriding earlier values.
     * Finally calls the 'createInterpreter' event.
     * @param {Profile} profile the executing profile, may be null for system level operation, default null
     * @param {Entity} self the Entity or EntityReference representing the 'self' entity
     * @returns {Interpreter} the created Interpreter
     */
    #createInterpreter(profile = null, self = null) {
        const interpreter = new Interpreter(this, profile);

        // define global functions (TODO: maybe just move this to variable defintions in the constructor)
        interpreter.defineGlobal('number', BUILTIN_NUMBER);
        interpreter.defineGlobal('ceil', BUILTIN_CEIL);
        interpreter.defineGlobal('floor', BUILTIN_FLOOR);
        interpreter.defineGlobal('max', BUILTIN_MAX);
        interpreter.defineGlobal('min', BUILTIN_MIN);
        interpreter.defineGlobal('sqrt', BUILTIN_SQRT);
        interpreter.defineGlobal('array', BUILTIN_ARRAY);
        interpreter.defineGlobal('len', BUILTIN_LEN);
        interpreter.defineGlobal('find', BUILTIN_FIND);
        interpreter.defineGlobal('list', BUILTIN_LIST);

        // define player, sToken, sActor, cMap and self variables when applicable
        if (profile) {
            interpreter.defineGlobal('player', new Value(profile, Type.PLAYER, ''));

            const sToken = profile.getSelectedToken(true);
            if (sToken) {
                interpreter.defineGlobal('sToken', new Value(new EntityReference(sToken), Type.ENTITY, ''));
                const sActor = TokenUtil.getActor(sToken);
                if (sActor) interpreter.defineGlobal('sActor', new Value(new EntityReference(sActor), Type.ENTITY, ''));
            }

            const cMap = EntityManagers.get('map').find(profile.getCurrentMap());
            if (cMap) interpreter.defineGlobal('cMap', new Value(new EntityReference(cMap), Type.ENTITY, ''));
        }
        if (self instanceof Entity && !(self instanceof EntityReference)) {
            self = new EntityReference(self);
        }
        if (self instanceof EntityReference) {
            interpreter.defineGlobal('self', new Value(self, Type.ENTITY, ''));
        }

        //TODO: remove debug function
        const DEBUG_PRINT = defineBuiltinFunc(1, (interpreter, paren, name, args) => { console.log(args[0].value); return Value.NULL; });
        interpreter.defineGlobal('print', DEBUG_PRINT);
        //interpreter.defineGlobal('testToken', new Value(new EntityReference(new Entity('token', 0)), Type.ENTITY, ''));

        // define global variables (may override existing vars)
        for (const [name, values] of Object.entries(this.#globalVars)) {
            interpreter.defineGlobal(name, values[values.length - 1]);
        }

        // event for modifying the interpreter on one side
        Events.trigger('createInterpreter', { interpreter: interpreter }, false)

        return interpreter;
    }

    /**
     * Adds a single dice roll / result.
     * @param {DiceResult} dr the dice result
     */
    addDiceRoll(dr) {
        this.#diceRolls.push(dr);
    }

    /**
     * Marks the provided {@link EntityReference} as modified.
     * The changes will be applied to the actual entity after execution is finished if the environment is configured to do so.
     * @param {EntityReference} entity the {@link EntityReference} to mark as modified.
     */
    modifiedEntity(entity) {
        this.#modifiedEntities.add(entity);
    }

    /**
     * Checks if the provided {@link Profile} has read access to the provided {@link Entity} property.
     * @param {Profile} profile the {@link Profile} or null if running as SYSTEM
     * @param {Entity} entity the {@link Entity} that is being accessed
     * @param {string} property the property name
     * @returns {boolean} true if the provided {@link Profile} can read the provided property.
     */
    checkReadAccess(profile, entity, property) {
        if (!(entity instanceof Entity)) return false;

        if (!entity.canView(profile)) return false;

        // special cased "properties"
        if (property == 'id') return true;
        if (property == 'manager') return true;

        const accessLevel = entity.getAccessLevel(profile);
        return entity.canViewProperty(property, accessLevel);
    }

    /**
     * Checks if the provided {@link Profile} has write access to the provided {@link Entity} property.
     * @param {Profile} profile the {@link Profile} or null if running as SYSTEM
     * @param {Entity} entity the {@link Entity} that is being accessed
     * @param {string} property the property name
     * @returns {boolean} true if the provided {@link Profile} can write to the provided property.
     */
    checkWriteAccess(profile, entity, property) {
        if (!(entity instanceof Entity)) return false;

        if (!entity.canEdit(profile)) return false;

        const accessLevel = entity.getAccessLevel(profile);
        return entity.canEditProperty(property, accessLevel);
    }

    /**
     * Adds and logs an error.
     * @param {number} line the line at which the error occured
     * @param {number} column the column / character at which the error occured
     * @param {string} description the error description
     */
    error(line, column, description) {
        // Format error report, example:
        // Error: Unexpected "," in argument list.
        //
        //     15 | function(first, second,);
        //                                ^-- Here.
        const prefix = this.#lines.length > 1 ? String(line).padStart(6, ' ') + ' | ' : '    ';
        const marker = ' '.repeat(column + prefix.length) + '^-- Here';
        const message = `Error: ${description}\n\n${prefix}${this.#lines[line]}\n${marker}`;

        // store error (and log to console for now)
        this.#errors.push(message);
        if (this.#logErrors) console.log(message);
    }

    /**
     * Adds and logs an error, using the Token to determine the location.
     * @param {Token} token the token to specifiy where the error occured
     * @param {string} description the error description
     */
    errorToken(token, description) {
        token.error = description;
        this.error(token.line, token.column, description);
    }
}

/**
 * Caches a parsed program.
 * Also keeps references to source lines and errors encountered during parsing.
 * @typedef CachedProgram
 * @property {Stmt[]} statements the parsed program statements
 * @property {string[]} lines the source code lines
 * @property {string[]} errors errors encountered during parsing
 */

/**
 * Caches a parsed expression.
 * Also keeps references to source lines and errors encountered during parsing.
 * @typedef CachedExpression
 * @property {Expr} expr the parsed expression
 * @property {string[]} lines the source code lines
 * @property {string[]} errors errors encountered during parsing
 */
