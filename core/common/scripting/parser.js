import { Type } from '../constants.js';
import { Modifier } from './dice.js';
import { ArrayGet, ArraySet, Assignment, Binary, Call, Dice, Get, Grouping, Literal, Logical, Set, Unary, Variable } from './expr.js';
import { Block, ExpressionStmt, FunctionDeclStmt, IfStmt, ReturnStmt, VarDeclStmt, WhileStmt } from './stmt.js';
import { AND, BANG, BANG_EQUAL, COMMA, DICE, DOT, ELSE, EOF, EQUAL, EQUAL_EQUAL, FALSE, FUNCTION, GREATER, GREATER_EQUAL, IDENTIFIER, IF, LEFT_BRACE, LEFT_PAREN, LEFT_SQUARE, LESS, LESS_EQUAL, MINUS, NULL, NUMBER, OR, PLUS, RETURN, RIGHT_BRACE, RIGHT_PAREN, RIGHT_SQUARE, SEMICOLON, SLASH, STAR, STRING, TRUE, VAR, WHILE } from './token.js';
import { Value } from './value.js';

// program      -> declaration* EOF
// declaration  -> funDecl | varDecl | statement;
// funDecl      -> FUNCTION IDENTIFIER LEFT_PAREN parameters? RIGHT_PAREN block
// paramters    -> IDENTIFIER ( COMMA IDENTIFIER )*
// varDecl      -> VAR IDENTIFIER ( EQUAL expression )? SEMICOLON
// statement    -> exprStmt | ifStmt | returnStmt | whileStmt | block
// block        -> LEFT_BRACE declaration* RIGHT_BRACE
// exprStmt     -> expression SEMICOLON
// ifStmt       -> IF LEFT_PAREN expression RIGHT_PAREN statement ( ELSE statement )?
// returnStmt   -> RETURN expression? SEMICOLON
// whileStmt    -> WHILE LEFT_PAREN expression RIGHT_PAREN statement

// expression   -> assignment
// assignment   -> ( call DOT )? IDENTIFIER EQUAL assignment | logic_or;
// logic_or     -> logic_and ( OR logic_and )*
// logic_and    -> equality ( AND equality )*
// equality     -> comparison ( ( BANG_EQUAL | EQUAL_EQUAL ) comparison )*
// comparison   -> term ( ( GREATER | GREATER_EQUAL | LESS | LESS_EQUAL ) term )*
// term         -> factor ( ( MINUS | PLUS ) factor )*
// factor       -> unary ( ( SLASH | STAR ) unary )*
// unary        -> ( BANG | MINUS | PLUS ) unary | dice
// dice         -> call ( DICE call modifiers STRING? )*
// modifiers    -> ( IDENTIFIER ( EQUAL_EQUAL | GREATER | GREATER_EQUAL | LESS | LESS_EQUAL )? call )*
// call         -> primary ( LEFT_PAREN arguments? RIGHT_PAREN | LEFT_SQUARE expression RIGHT_SQUARE | DOT IDENTIFIER )*
// arguments    -> expression ( COMMA expression )*
// primary      -> NUMBER | STRING | TRUE | FALSE | NULL | IDENTIFIER | LEFT_PAREN expression RIGHT_PAREN
export class Parser {
    #scripting;
    #tokens;
    #current = 0;

    constructor(scripting, tokens) {
        this.#scripting = scripting;
        this.#tokens = tokens;
    }

    parseExpression() {
        try {
            const expr = this.expression();
            this.#consume(EOF, 'Expected end of expression');
            return expr;
        } catch(error) {
            if(this.#scripting.errors.length == 0) this.#scripting.error(0, 0, 'Internal: '+error.message);
            return null;
        }
    }

    // Statements
    program() {
        const statements = [];
        while(!this.#isAtEOF()) {
            statements.push(this.declaration());
        }
        return statements;
    }

    declaration() {
        try {
            if(this.#match(FUNCTION)) return this.functionDeclaration();
            if(this.#match(VAR)) return this.varDeclaration();

            return this.statement();
        } catch(error) {
            //console.log(error);
            // get to valid state to resume parsing
            this.#synchronize();
        }
    }

    functionDeclaration() {
        const name = this.#consume(IDENTIFIER, 'Expected function name');
        const params = [];
        this.#consume(LEFT_PAREN, 'Expected ( after function name');
        if(!this.#check(RIGHT_PAREN)) {
            do {
                params.push(this.#consume(IDENTIFIER, 'Expected parameter name'));
            } while(this.#match(COMMA));
        }
        this.#consume(RIGHT_PAREN, 'Expected ) after parameters');

        this.#consume(LEFT_BRACE, 'Expected { before function body');
        const body = this.block();
        return new FunctionDeclStmt(name, params, body);
    }

    varDeclaration() {
        const name = this.#consume(IDENTIFIER, 'Expected variable name');

        var initializer = null;
        if(this.#match(EQUAL)) {
            initializer = this.expression();
        }

        this.#consume(SEMICOLON, 'Expected ; after variable declaration');
        return new VarDeclStmt(name, initializer);
    }

    statement() {
        if(this.#match(IF)) return this.ifStatement();
        if(this.#match(RETURN)) return this.returnStatement();
        if(this.#match(WHILE)) return this.whileStatement();
        if(this.#match(LEFT_BRACE)) return new Block(this.block());

        return this.expressionStatement();
    }

    block() {
        const statements = [];
        while(!this.#check(RIGHT_BRACE) && !this.#isAtEOF()) {
            statements.push(this.declaration());
        }
        this.#consume(RIGHT_BRACE, 'Expected } after block');
        return statements;
    }

    expressionStatement() {
        const expr = this.expression();
        this.#consume(SEMICOLON, 'Expected ; after expression');
        return new ExpressionStmt(expr);
    }

    ifStatement() {
        this.#consume(LEFT_PAREN, 'Expected ( after if');
        const condition = this.expression();
        this.#consume(RIGHT_PAREN, 'Expected ) after if condition');

        const thenBranch = this.statement();
        var elseBranch = null;
        if(this.#match(ELSE)) {
            elseBranch = this.statement();
        }

        return new IfStmt(condition, thenBranch, elseBranch);
    }

    returnStatement() {
        const keyword = this.#previous();
        var expression = null;
        if(!this.#check(SEMICOLON)) {
            expression = this.expression();
        }
        this.#consume(SEMICOLON, 'Expected ; after return value');
        return new ReturnStmt(keyword, expression);
    }

    whileStatement() {
        this.#consume(LEFT_PAREN, 'Expected ( after while');
        const condition = this.expression();
        this.#consume(RIGHT_PAREN, 'Expected ) after while condition');

        const body = this.statement();
        return new WhileStmt(condition, body);
    }

    // Expressions
    expression() {
        return this.assignment();
    }

    assignment() {
        const expr = this.or();

        if(this.#match(EQUAL)) {
            const equals = this.#previous();
            const value = this.or();

            if(expr instanceof Variable) {
                const name = expr.name;
                return new Assignment(name, value);
            } else if(expr instanceof Get) {
                const get = expr;
                return new Set(get.object, get.name, value);
            } else if(expr instanceof ArrayGet) {
                const aget = expr;
                return new ArraySet(aget.object, aget.index, aget.square, value);
            }

            error(equals, 'Invalid assignment target');
        }

        return expr;
    }

    or() {
        var expr = this.and();

        while(this.#match(OR)) {
            const operator = this.#previous();
            const right = this.and();
            expr = new Logical(expr, operator, right);
        }

        return expr;
    }

    and() {
        var expr = this.equality();

        while(this.#match(AND)) {
            const operator = this.#previous();
            const right = this.equality();
            expr = new Logical(expr, operator, right);
        }

        return expr;
    }

    equality() {
        var expr = this.comparison();

        while(this.#match(BANG_EQUAL, EQUAL_EQUAL)) {
            const operator = this.#previous();
            const right = this.comparison();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    comparison() {
        var expr = this.term();

        while(this.#match(GREATER, GREATER_EQUAL, LESS, LESS_EQUAL)) {
            const operator = this.#previous();
            const right = this.term();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    term() {
        var expr = this.factor();

        while(this.#match(MINUS, PLUS)) {
            const operator = this.#previous();
            const right = this.factor();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    factor() {
        var expr = this.unary();

        while(this.#match(SLASH, STAR)) {
            const operator = this.#previous();
            const right = this.unary();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    unary() {
        if(this.#match(BANG, PLUS, MINUS)) {
            const operator = this.#previous();
            const right = this.unary();
            return new Unary(operator, right);
        }

        return this.dice();
    }

    dice() {
        var expr = this.call();

        while(this.#match(DICE)) {
            const token = this.#previous();
            const sides = this.call();
            
            const modifiers = this.modifiers();
            var label = null;
            if(this.#match(STRING)) {
                label = this.#previous();
            }

            expr = new Dice(expr, token, sides, modifiers, label);
        }

        return expr;
    }

    modifiers() {
        const modifiers = [];
        while(this.#match(IDENTIFIER)) {
            const identifier = this.#previous();
            var comparison = EQUAL_EQUAL;
            if(this.#match(EQUAL_EQUAL, GREATER, GREATER_EQUAL, LESS, LESS_EQUAL)) {
                comparison = this.#previous();
            }
            const value = this.call();

            modifiers.push(new Modifier(identifier, comparison, value));            
        }
        return modifiers;
    }

    call() {
        var expr = this.primary();

        while(true) {
            if(this.#match(LEFT_PAREN)) {
                const args = [];
                if(!this.#check(RIGHT_PAREN)) {
                    do {
                        args.push(this.expression());
                    } while(this.#match(COMMA));
                }
                const paren = this.#consume(RIGHT_PAREN, 'Expected ) after arguments');

                expr = new Call(expr, paren, args);
            } else if(this.#match(LEFT_SQUARE)) {
                const index = this.expression();
                const square = this.#consume(RIGHT_SQUARE, 'Expected ] after index');

                expr = new ArrayGet(expr, index, square);
            } else if(this.#match(DOT)) {
                const name = this.#consume(IDENTIFIER, 'Expected property name after .');
                expr = new Get(expr, name);
            } else {
                break;
            }
        }

        return expr;
    }

    primary() {
        if(this.#match(NUMBER)) {
            const value = this.#previous().literal;
            const isInteger = Math.trunc(value) == value;
            return new Literal(new Value(value, Type.DOUBLE, String(isInteger ? Math.trunc(value) : value)));
        }
        if(this.#match(STRING)) {
            const value = this.#previous().literal;
            return new Literal(new Value(value, Type.STRING, '"'+value+'"'));
        }
        if(this.#match(TRUE)) return new Literal(true, Type.BOOLEAN, 'true');
        if(this.#match(FALSE)) return new Literal(false, Type.BOOLEAN, 'false');
        if(this.#match(NULL)) return new Literal(null, Type.NULL, 'null');
        if(this.#match(IDENTIFIER)) return new Variable(this.#previous());
        if(this.#match(LEFT_PAREN)) {
            const expr = this.expression();
            this.#consume(RIGHT_PAREN, 'Expected ) after expression');
            return new Grouping(expr);
        }

        throw this.#error(this.#peek(), 'Expected expression');
    }

    // helpers
    #match(...types) {
        for(const type of types) {
            if(this.#check(type)) {
                this.#advance();
                return true;
            }
        }

        return false;
    }

    #consume(type, message) {
        if(this.#check(type)) return this.#advance();
        throw this.#error(this.#peek(), message);
    }

    #check(type) {
        return this.#peek().type == type;
    }

    #advance() {
        if(!this.#isAtEOF()) this.#current++;
        return this.#previous();
    }

    #isAtEOF() {
        return this.#peek().type == EOF;
    }

    #peek() {
        return this.#tokens[this.#current];
    }

    #previous() {
        return this.#tokens[this.#current - 1];
    }

    // error handling
    #error(token, message) {
        this.#scripting.errorToken(token, message);
        return new Error();
    }

    #synchronize() {
        // skip to next statement so we can resume parsing from a (somewhat) known state
        this.#advance();

        while(!this.#isAtEOF()) {
            if(this.#previous().type == SEMICOLON) return;

            switch(this.#peek().type) {
                case IF:
                case VAR:
                    return; //TODO: add more cases once they exist (FUNCTION, WHILE, FOR, RETURN, ...)
            }

            this.#advance();
        }
    }
}
