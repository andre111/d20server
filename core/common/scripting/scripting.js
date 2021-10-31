import { Type } from '../constants.js';
import { EntityManagers } from '../entity/entity-managers.js';
import { EntityReference } from '../entity/entity-reference.js';
import { Entity } from '../entity/entity.js';
import { Events } from '../events.js';
import { TokenUtil } from '../util/tokenutil.js';
import { BUILTIN_ARRAY, BUILTIN_CEIL, BUILTIN_FIND, BUILTIN_FLOOR, BUILTIN_LEN, BUILTIN_LIST, BUILTIN_MAX, BUILTIN_MIN, BUILTIN_NUMBER, BUILTIN_SQRT, Func } from './func.js';
import { Interpreter } from './interpreter.js';
import { Parser } from './parser.js';
import { Scanner } from './scanner.js';
import { COMMENT, NEWLINE, UNKNOWN, WHITESPACE } from './token.js';
import { Value } from './value.js';

// see: craftinginterpreters.com
// possible syntactic sugar to add: +=, -=, *=, /=, for loops
export class Scripting {
    #lines;
    #errors;
    #diceRolls;
    
    #applyEntityChanges;
    #modifiedEntities;
    #globalVars;

    constructor(applyEntityChanges = true) {
        this.#applyEntityChanges = applyEntityChanges;
        this.#modifiedEntities = new Set();
        this.#globalVars = {};
    }

    // Global Vars
    //---------------------------------------------------------------
    pushVariable(name, value) {
        if(!this.#globalVars[name]) this.#globalVars[name] = [];
        this.#globalVars[name].push(value);
    }

    popVariable(name) {
        const old = this.#globalVars[name];
        if(!old) return;
        if(!old.pop()) {
            delete this.#globalVars[name];
        }
    }


    // Programs
    //---------------------------------------------------------------
    interpret(source, profile, self, interpreterCallback = null) {
        const program = this.parse(source);
        this.execute(program, profile, self, interpreterCallback);
    }

    parse(source) {
        return {
            statements: this.#createParser(source).program(),
            lines: this.#lines,
            errors: this.#errors
        };
    }

    execute(program, profile, self, interpreterCallback = null) {
        // reset state
        this.#errors = [];
        this.#diceRolls = [];
        this.#modifiedEntities.clear();
        this.#lines = program.lines;

        // check for parse errors
        if(program.errors.length != 0) {
            this.#errors = program.errors;
            return;
        }

        // run interpreter
        const interpreter = this.#createInterpreter(profile, self);
        if(interpreterCallback) interpreterCallback(interpreter);
        interpreter.interpret(program.statements);

        // update entities
        if(this.#applyEntityChanges) {
            for(const modifiedEntity of this.#modifiedEntities) {
                modifiedEntity.performUpdate();
            }
        }
    }

    // Expressions
    //---------------------------------------------------------------
    interpretExpression(source, profile, self, interpreterCallback = null) {
        const expression = this.parseExpression(source);
        return this.evalExpression(expression, profile, self, interpreterCallback);
    }

    parseExpression(source) {
        return {
            expr: this.#createParser(source).parseExpression(),
            lines: this.#lines,
            errors: this.#errors
        };
    }

    evalExpression(expression, profile, self, interpreterCallback = null) {
        // reset state
        this.#errors = [];
        this.#diceRolls = [];
        this.#modifiedEntities.clear();
        this.#lines = expression.lines;

        // check for parse errors
        if(expression.errors.length != 0) {
            this.#errors = expression.errors;
            return;
        }

        // run interpreter
        const interpreter = this.#createInterpreter(profile, self);
        if(interpreterCallback) interpreterCallback(interpreter);
        const result = interpreter.interpretExpression(expression.expr);

        // update entities
        if(this.#applyEntityChanges) {
            for(const modifiedEntity of this.#modifiedEntities) {
                modifiedEntity.performUpdate();
            }
        }

        return result;
    }

    //---------------------------------------------------------------
    tokenize(source, keepAll = false, fullparse = false) {
        this.#lines = source.split('\n');
        this.#errors = [];
        const tokens = new Scanner(this, source, keepAll).tokens;
        if(fullparse) {
            // perform full parse for error detection (TODO: needs some better way to skip the otherwise not included tokens)
            new Parser(this, tokens.filter(t => (t.type != UNKNOWN && t.type != COMMENT && t.type != WHITESPACE && t.type != NEWLINE))).program();
        }
        return tokens;
    }

    //---------------------------------------------------------------
    get applyEntityChanges() {
        return this.#applyEntityChanges;
    }

    get diceRolls() {
        return this.#diceRolls;
    }

    get errors() {
        return this.#errors;
    }

    throwIfErrored() {
        if(this.#errors.length != 0) {
            throw new Error(this.#errors.join('\n'));
        }
    }

    #createParser(source) {
        this.#lines = source.split('\n');
        this.#errors = [];
        this.#diceRolls = [];

        // scan and parse
        const scanner = new Scanner(this, source);
        return new Parser(this, scanner.tokens);
    }

    #createInterpreter(profile, self) {
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
        if(profile) {
            interpreter.defineGlobal('player', new Value(profile, Type.PLAYER, ''));

            const sToken = profile.getSelectedToken(true);
            if(sToken) {
                interpreter.defineGlobal('sToken', new Value(new EntityReference(sToken), Type.ENTITY, ''));
                const sActor = TokenUtil.getActor(sToken);
                if(sActor) interpreter.defineGlobal('sActor', new Value(new EntityReference(sActor), Type.ENTITY, ''));
            }

            const cMap = EntityManagers.get('map').find(profile.getCurrentMap());
            if(cMap) interpreter.defineGlobal('cMap', new Value(new EntityReference(cMap), Type.ENTITY, ''));
        }
        if(self instanceof Entity && !(self instanceof EntityReference)) {
            self = new EntityReference(self);
        }
        if(self instanceof EntityReference) {
            interpreter.defineGlobal('self', new Value(self, Type.ENTITY, ''));
        }

        //TODO: remove debug function
        const DEBUG_PRINT = new Func(1);
        DEBUG_PRINT.call = (interpreter, paren, name, args) => console.log(args[0].value);
        interpreter.defineGlobal('print', DEBUG_PRINT);
        interpreter.defineGlobal('testToken', new Value(new EntityReference(new Entity('token', 0)), Type.ENTITY, ''));

        // define global variables (may override existing vars)
        for(const [name, values] of Object.entries(this.#globalVars)) {
            interpreter.defineGlobal(name, values[values.length-1]);
        }

        // event for modifying the interpreter on one side
        Events.trigger('createInterpreter', { interpreter: interpreter }, false)

        return interpreter;
    }

    addDiceRoll(dr) {
        this.#diceRolls.push(dr);
    }

    modifiedEntity(entity) {
        this.#modifiedEntities.add(entity);
    }

    checkReadAccess(profile, entity, property) {
        if(!(entity instanceof Entity)) return false;

        const accessLevel = entity.getAccessLevel(profile);
        if(!entity.canViewWithAccess(accessLevel)) return false;

        // special cased "properties"
        if(property == 'id') return true;
        if(property == 'manager') return true;

        return entity.canViewProperty(property, accessLevel);
    }

    checkWriteAccess(profile, entity, property) {
        if(!(entity instanceof Entity)) return false;

        const accessLevel = entity.getAccessLevel(profile);
        if(!entity.canEditWithAccess(accessLevel)) return false;

        return entity.canEditProperty(property, accessLevel);
    }

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
        console.log(message);
    }

    errorToken(token, description) {
        token.error = description;
        this.error(token.line, token.column, description);
    }
}

//TODO: Remove Testing code
/*
Events.on('serverInit', () => {
    const script = new Scripting(false);
    const result = script.interpretExpression('(3 * 2 + 5 - sqrt(25)) / min(1.5, 4) + 1d20"fire"');
    console.log(result.value, ' <- '+result.expr);
    console.log(script.diceRolls);

    script.interpret(`
        var a = 3 * 2; 

        if(a == 42) {
            print(a); 
        } else {
            var a = print;
            a("Hello world!");
        }
        print(a);

        // testing function declaraction and closures
        function makeCounter() {
            var i = 0;
            function count() {
                i = i + 1;
                return i;
            }
            return count;
        }

        var counter = makeCounter();
        print(counter());
        print(counter());
        var counterTwo = makeCounter();
        print(counterTwo());
        print(counter());

        // testing entity property access
        print(testToken.width);
        testToken.width = 2 * testToken.width;
        print(testToken.width);

        var actor = find("actor", 2);
        print(actor.name);
        print(actor.id);
        print(actor.manager);
        
        //a = syntax % error;
        a = 23;

        //var another error;
        //var var wrong;
    `);
});
*/
