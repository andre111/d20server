import { Scripting } from '../../common/scripting/scripting.js';
import { EOF, IDENTIFIER, LEFT_PAREN, NEWLINE, UNKNOWN, WHITESPACE } from '../../common/scripting/token.js';

//TODO: somehow add support for error reporting directly in editor (needs display and full parsing)
const SCRIPT = new Scripting(false);
export class CodeEditor extends HTMLElement {
    #initialized;

    #textarea;
    #pre;
    #code;

    #value;

    #fullparseTimeout;

    constructor() {
        super();
    }
    
    connectedCallback() {
        // Added to document
        if(!this.#initialized) {
            this.#initialized = true;

            // Defaults
            const placeholder = this.getAttribute("placeholder") || "";
            this.innerHTML = ""; // Clear Content
            
            // Create Textarea
            this.#textarea = document.createElement("textarea");
            this.#textarea.placeholder = placeholder;
            this.#textarea.value = '';
            this.#textarea.spellcheck = false;
            
            if(this.getAttribute("name")) {
                this.#textarea.name = this.getAttribute("name"); // for use in forms
                this.removeAttribute("name");
            }
            
            this.#textarea.oninput = () => this.update(this.#textarea.value);
            this.#textarea.onscroll = () => {
                this.#pre.scrollTop = this.#textarea.scrollTop;
                this.#pre.scrollLeft = this.#textarea.scrollLeft;
            };
            
            this.append(this.#textarea);
        
            // Create pre code
            this.#code = document.createElement("code");
            this.#code.className = "language-d20";
            this.#code.innerText = '';
            
            this.#pre = document.createElement("pre");
            this.#pre.setAttribute("aria-hidden", "true"); // Hide for screen readers
            this.#pre.append(this.#code);
            this.append(this.#pre);
        }
    }

    update(value, fullparse = false) {
        // Update code
        this.#textarea.value = value;
        this.#value = value;

        // Syntax Highlight
        const scriptMarker = '?SCRIPT?\n';
        if(value.startsWith(scriptMarker)) {
            value = value.substring(scriptMarker.length);

            // start timeout for full parse
            if(!fullparse) {
                if(this.#fullparseTimeout) clearTimeout(this.#fullparseTimeout);
                this.#fullparseTimeout = setTimeout(() => this.update(this.#value, true), 1000);
            }

            // perform tokenize/parse
            const tokens = SCRIPT.tokenize(value, true, fullparse);
            const converted = [];
            converted.push('<span class="line">');
            for(var i=0; i<tokens.length; i++) {
                const token = tokens[i];
                if(token.type == EOF) break; // stop at EOF (and do NOT include it)

                // find token class (simply based on type description + small hack to "detect functions")
                var tokenClass = token.type.description;
                var tokenError = '';
                if(token.type == IDENTIFIER) {
                    var next = i+1;
                    while(tokens[next].type == WHITESPACE) next++;

                    if(tokens[next].type == LEFT_PAREN) tokenClass = 'function';
                }
                
                // add error markers
                //TODO: add them on other errors aswell
                if(token.type == UNKNOWN) {
                    tokenClass = 'error';
                    tokenError = token.lexeme.startsWith('"') ? 'Unclosed string' : 'Unexpected character';
                } else if(token.error) {
                    tokenClass += ' error';
                    tokenError = token.error;
                }

                // append token lexeme (with potential highlighting)
                const lexeme = this.htmlEntitize(token.lexeme);
                if(tokenClass) {
                    converted.push(`<span class="token ${tokenClass}" ${tokenError ? `data-error="${tokenError}"` : ''}>${lexeme}</span>`);
                } else {
                    converted.push(lexeme);
                }
                
                // add line sepparators
                if(token.type == NEWLINE) {
                    converted.push('</span><span class="line">');
                }
            }
            this.#code.innerHTML = scriptMarker + converted.join('') + '</span>\n'; // NOTE: extra \n required to "stay in sync" with textarea
        } else {
            const lines = this.htmlEntitize(value).split(/\n/g);
            const converted = [];
            for(const line of lines) {
                converted.push(`<span class="line">${line}\n</span>`);
            }
            this.#code.innerHTML = converted.join('') + '\n'; // NOTE: extra \n required to "stay in sync" with textarea
        }
    }

    htmlEntitize(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        switch(name) {
        case "placeholder":
            this.#textarea.placeholder = newValue;
            break;
        }
    }
    
    get disabled() {
        return this.#textarea.disabled;
    }

    set disabled(flag) {
        this.#textarea.disabled = flag;
    }

    get value() {
        return this.#value;
    }

    set value(v) {
        if(v != this.#value) this.update(v);
    }
    
    static get observedAttributes() {
        return ["placeholder"];
    }
} 

customElements.define("code-editor", CodeEditor);
