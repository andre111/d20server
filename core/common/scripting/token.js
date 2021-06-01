export class Token {
    #type;
    #lexeme;
    #literal;
    
    #line;
    #column;

    constructor(type, lexeme, literal, line, column) {
        this.#type = type;
        this.#lexeme = lexeme;
        this.#literal = literal;

        this.#line = line;
        this.#column = column;
    }

    get type() {
        return this.#type;
    }

    get lexeme() {
        return this.#lexeme;
    }

    get literal() {
        return this.#literal;
    }

    get line() {
        return this.#line;
    }

    get column() {
        return this.#column;
    }
}

// TYPE VALUES
export const LEFT_PAREN = Symbol();
export const RIGHT_PAREN = Symbol();
export const LEFT_BRACE = Symbol();
export const RIGHT_BRACE = Symbol();

export const COMMA = Symbol();
export const DOT = Symbol();
export const SEMICOLON = Symbol();

export const MINUS = Symbol();
export const PLUS = Symbol();
export const STAR = Symbol();
export const SLASH = Symbol();

export const BANG = Symbol();
export const EQUAL = Symbol();

export const DICE = Symbol();

// comparisons
export const BANG_EQUAL = Symbol();
export const EQUAL_EQUAL = Symbol();
export const GREATER = Symbol();
export const GREATER_EQUAL = Symbol();
export const LESS = Symbol();
export const LESS_EQUAL = Symbol();

// literals
export const IDENTIFIER = Symbol();
export const STRING = Symbol();
export const NUMBER = Symbol();

// keywords
export const FALSE = Symbol();
export const TRUE = Symbol();
export const NULL = Symbol();

export const AND = Symbol();
export const OR = Symbol();
export const IF = Symbol();
export const THEN = Symbol();
export const ELSE = Symbol();
export const VAR = Symbol();
export const WHILE = Symbol();
export const FUNCTION = Symbol();
export const RETURN = Symbol();

export const EOF = Symbol();

// Keywords
export const KEYWORDS = Object.freeze({
    'false': FALSE,
    'true': TRUE,
    'null': NULL,

    'and': AND,
    'or': OR,
    'if': IF,
    'then': THEN,
    'else': ELSE,
    'var': VAR,
    'while': WHILE,
    'function': FUNCTION,
    'return': RETURN
});
