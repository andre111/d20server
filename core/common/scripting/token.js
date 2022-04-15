// @ts-check

/**
 * Represents a single token created by the scanner and used throughout the scripting system.
 */
export class Token {
    #type;
    #lexeme;
    #literal;

    #line;
    #column;
    #error;

    /**
     * @param {Symbol} type the type of the token
     * @param {string} lexeme the source code representation of this token
     * @param {string | number} literal the literal value of this token
     * @param {number} line the source line location of this token
     * @param {number} column the source column location of this token
     */
    constructor(type, lexeme, literal, line, column) {
        this.#type = type;
        this.#lexeme = lexeme;
        this.#literal = literal;

        this.#line = line;
        this.#column = column;
        this.#error = '';
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

    get error() {
        return this.#error;
    }

    set error(e) {
        this.#error = e;
    }
}

// TYPE VALUES
export const LEFT_PAREN = Symbol('punctuation');
export const RIGHT_PAREN = Symbol('punctuation');
export const LEFT_BRACE = Symbol('punctuation');
export const RIGHT_BRACE = Symbol('punctuation');
export const LEFT_SQUARE = Symbol('punctuation');
export const RIGHT_SQUARE = Symbol('punctuation');

export const COMMA = Symbol('punctuation');
export const DOT = Symbol('punctuation');
export const SEMICOLON = Symbol('punctuation');

export const MINUS = Symbol('operator');
export const PLUS = Symbol('operator');
export const STAR = Symbol('operator');
export const SLASH = Symbol('operator');

export const BANG = Symbol('operator');
export const EQUAL = Symbol('operator');

export const DICE = Symbol('dice');

// comparisons
export const BANG_EQUAL = Symbol('operator');
export const EQUAL_EQUAL = Symbol('operator');
export const GREATER = Symbol('operator');
export const GREATER_EQUAL = Symbol('operator');
export const LESS = Symbol('operator');
export const LESS_EQUAL = Symbol('operator');
/** @typedef {BANG_EQUAL | EQUAL_EQUAL | GREATER | GREATER_EQUAL | LESS | LESS_EQUAL} COMPARISON */

// literals
export const IDENTIFIER = Symbol('identifier');
export const STRING = Symbol('string');
export const NUMBER = Symbol('number');

// keywords
export const FALSE = Symbol('boolean');
export const TRUE = Symbol('boolean');
export const NULL = Symbol('null');

export const AND = Symbol('keyword');
export const OR = Symbol('keyword');
export const IF = Symbol('keyword');
export const THEN = Symbol('keyword');
export const ELSE = Symbol('keyword');
export const VAR = Symbol('keyword');
export const WHILE = Symbol('keyword');
export const FUNCTION = Symbol('keyword');
export const RETURN = Symbol('keyword');

export const EOF = Symbol();
export const UNKNOWN = Symbol();
export const WHITESPACE = Symbol();
export const NEWLINE = Symbol();
export const COMMENT = Symbol('comment');

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
