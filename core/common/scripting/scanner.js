// @ts-check
import { Scripting } from './scripting.js';
import { BANG, BANG_EQUAL, COMMA, COMMENT, DICE, DOT, EOF, EQUAL, EQUAL_EQUAL, GREATER, GREATER_EQUAL, IDENTIFIER, KEYWORDS, LEFT_BRACE, LEFT_PAREN, LEFT_SQUARE, LESS, LESS_EQUAL, MINUS, NEWLINE, NUMBER, PLUS, RIGHT_BRACE, RIGHT_PAREN, RIGHT_SQUARE, SEMICOLON, SLASH, STAR, STRING, Token, UNKNOWN, WHITESPACE } from './token.js';

/**
 * Scanner converting a source string into a list of {@link Token}s.
 */
export class Scanner {
    #scripting
    #source;
    #keepAll;

    #start = 0;
    #current = 0;

    #line = 0;
    #column = 0;
    #startColumn = 0;

    /** @type {Token[]} */
    #tokens;

    /**
     * Scannes the provided source and builds a list of {@link Token}s.
     * Reports encountered errors to the provided {@link Scripting} environment.
     * The final list of tokens can be accessed using the {@link tokens} property.
     * 
     * @param {Scripting} scripting the {@link Scripting} environment
     * @param {string} source the script source string
     * @param {boolean} keepAll flag specifying whether to keep comments/whitespace/unknown tokens, used for more detailed error reporting, default false
     */
    constructor(scripting, source, keepAll = false) {
        this.#scripting = scripting;
        this.#source = source;
        this.#keepAll = keepAll;

        this.#tokens = [];
        this.#scanTokens();
    }

    /**
     * Scans all tokens from the source.
     */
    #scanTokens() {
        while (!this.#isAtEOF()) {
            this.#start = this.#current;
            this.#startColumn = this.#column;
            this.#scanToken();
        }

        this.#addToken(EOF, '', '<EOF>');
    }

    /**
     * Scans and adds a single token.
     */
    #scanToken() {
        const c = this.#advance();
        switch (c) {
            case '(': this.#addToken(LEFT_PAREN); break;
            case ')': this.#addToken(RIGHT_PAREN); break;
            case '{': this.#addToken(LEFT_BRACE); break;
            case '}': this.#addToken(RIGHT_BRACE); break;
            case '[': this.#addToken(LEFT_SQUARE); break;
            case ']': this.#addToken(RIGHT_SQUARE); break;
            case ',': this.#addToken(COMMA); break;
            case '.': this.#addToken(DOT); break;
            case ';': this.#addToken(SEMICOLON); break;
            case '-': this.#addToken(MINUS); break;
            case '+': this.#addToken(PLUS); break;
            case '*': this.#addToken(STAR); break;
            case '/':
                if (this.#match('/')) { // comment
                    while (this.#peek() != '\n' && !this.#isAtEOF()) this.#advance();
                    if (this.#keepAll) this.#addToken(COMMENT);
                } else {
                    this.#addToken(SLASH);
                }
                break;
            case '!':
                this.#addToken(this.#match('=') ? BANG_EQUAL : BANG);
                break;
            case '=':
                this.#addToken(this.#match('=') ? EQUAL_EQUAL : EQUAL);
                break;
            case '>':
                this.#addToken(this.#match('=') ? GREATER_EQUAL : GREATER);
                break;
            case '<':
                this.#addToken(this.#match('=') ? LESS_EQUAL : LESS);
                break;
            case '"': this.#string(); break;
            case ' ':
            case '\r':
            case '\t':
                if (this.#keepAll) this.#addToken(WHITESPACE);
                break; // whitespace
            case '\n':
                this.#line++;
                this.#column = 0;
                if (this.#keepAll) this.#addToken(NEWLINE);
                break;
            default:
                if (this.#isDigit(c)) {
                    this.#number();
                } else if (this.#isAlpha(c)) {
                    this.#identifier();
                } else {
                    if (this.#keepAll) this.#addToken(UNKNOWN);
                    this.#scripting.error(this.#line, this.#startColumn, 'Unexpected character');
                }
                break;
        }
    }

    /**
     * Scans and adds a STRING literal token.
     * Supports basic escape sequences: \\ and \".
     * Expects the leading " to be already scanned/skipped.
     */
    #string() {
        var literal = '';
        while (this.#peek() != '"' && this.#peek() != '\n' && !this.#isAtEOF()) {
            // check (and skip) escape sequence
            if (this.#peek() == '\\') {
                if (this.#peekNext() != '\\' && this.#peekNext() != '"') {
                    this.#scripting.error(this.#line, this.#column, 'Invalid escape sequence: \\' + this.#peekNext()); // note: this currently will not be shown by the editor
                }
                this.#advance();
            }

            literal += this.#advance();
        }

        if (this.#peek() != '"') {
            this.#scripting.error(this.#line, this.#column, 'Unterminated string');
            if (this.#keepAll) this.#addToken(UNKNOWN);
            return;
        }
        this.#advance();

        // get literal value (without quotes)
        //const literal = this.#source.substring(this.#start + 1, this.#current - 1);
        this.#addToken(STRING, literal);
    }

    /**
     * Scans and adds a NUMBER literal token. 
     * Supports an optional fractional part.
     * Expects the leading digit to be already scanned/skipped.
     */
    #number() {
        while (this.#isDigit(this.#peek())) this.#advance();

        // check for fractional part
        if (this.#peek() == '.' && this.#isDigit(this.#peekNext())) {
            this.#advance();
            while (this.#isDigit(this.#peek())) this.#advance();
        }

        this.#addToken(NUMBER, Number(this.#source.substring(this.#start, this.#current)));
    }

    /**
     * Scans and adds an identifier (or DICE token) starting from the current location.
     * Expects the leading character to be already scanned/skipped.
     */
    #identifier() {
        // ugly hack to make dice work
        if (this.#isParsingDiceIdentifier()) {
            this.#addToken(DICE);
            return;
        }

        // parse normal identifier
        while (this.#isAlphaNumeric(this.#peek())) this.#advance();

        const text = this.#source.substring(this.#start, this.#current);
        var type = KEYWORDS[text];
        if (!type) type = IDENTIFIER;
        this.#addToken(type);
    }

    /**
     * Returns the current character and advances to the next AFTERWARDS.
     * Does NOT perform range checking.
     * 
     * @returns {string}
     */
    #advance() {
        this.#column++;
        return this.#source[this.#current++];
    }

    /**
     * Checks if the current character matches the expected value.
     * If true advances to the next character.
     * 
     * @param {string} expected the expected value
     * @returns {boolean} true when sucessfully matched and advanced, false otherwise
     */
    #match(expected) {
        if (this.#isAtEOF()) return false;
        if (this.#source[this.#current] != expected) return false;

        this.#column++;
        this.#current++;
        return true;
    }

    /**
     * Returns the current character.
     * @returns {string} the current character or \0 if at eof
     */
    #peek() {
        if (this.#isAtEOF()) return '\0';
        return this.#source[this.#current];
    }

    /**
     * Returns the next character.
     * @returns {string} the next character or \0 if at eof
     */
    #peekNext() {
        if (this.#current + 1 >= this.#source.length) return '\0';
        return this.#source[this.#current + 1];
    }

    /**
     * Adds a new token to the list of parsed tokens.
     * @param {Symbol} type the type of this token, refer to token.js for possible values
     * @param {string | number} literal the literal value of this token, optional
     * @param {string} lexeme the source string representing this token, will be derived from start and current positions if not specified
     */
    #addToken(type, literal = null, lexeme = '') {
        lexeme = lexeme || this.#source.substring(this.#start, this.#current);
        this.#tokens.push(new Token(type, lexeme, literal, this.#line, this.#startColumn));
    }

    /**
     * @returns {boolean} true if at eof, false otherwise
     */
    #isAtEOF() {
        return this.#current >= this.#source.length;
    }

    /**
     * @param {string} c the character to test
     * @returns {boolean} true if the character is a digit, false otherwise
     */
    #isDigit(c) {
        return c >= '0' && c <= '9';
    }

    /**
     * @param {string} c the character to test
     * @returns {boolean} true if the character matches [a-zA-z_], false otherwise
     */
    #isAlpha(c) {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_';
    }

    /**
     * @param {string} c the character to test
     * @returns {boolean} true if isAlpha(c) or isDigit(c) is true, false otherwise
     */
    #isAlphaNumeric(c) {
        return this.#isAlpha(c) || this.#isDigit(c);
    }

    /**
     * Checks if the currently scanned identifier should actually be a DICE token.
     * TODO: This is not the correct way to do this, as it breaks identifier name definitions (names starting with d<digit> cannot be used).
     * But for now this is a required oddity to make dice expressions work.
     * 
     * @returns {boolean} true if the currently scanned identifier should actually be a DICE token, false otherwise
     */
    #isParsingDiceIdentifier() {
        //TODO: this is a really ugly part of an otherwise nice scanner/parser, SEE IF IT CAN BE REPLACED WITH A GOOD SOLUTION
        // ugly hack to detect if identifier is actually dice operation
        // check if it is a single 'd' followed by a digit
        // (-> this results in variablenames starting with 'd[digit]' not working as expected (does not get parsed as a single identifer))
        if (this.#current - this.#start != 1) return false;
        const c = this.#source[this.#start];
        if (c != 'd' && c != 'D' && c != 'w' && c != 'W') return false;

        if (!this.#isAlphaNumeric(this.#peek())) return true; // case 1: just 'd' with no more alphanum characters -> dice operator
        return this.#isDigit(this.#peek()); // case 2: 'd[digit]' -> dice operator
    }

    /** the list of scanned tokens */
    get tokens() {
        return this.#tokens;
    }
}
