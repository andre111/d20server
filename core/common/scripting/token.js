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
export const LEFT_PAREN = Symbol('punctuation');
export const RIGHT_PAREN = Symbol('punctuation');
export const LEFT_BRACE = Symbol('punctuation');
export const RIGHT_BRACE = Symbol('punctuation');

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
