import { Scripting } from '../../common/scripting/scripting.js';
import { EOF } from '../../common/scripting/token.js';

//TODO: somehow add support for error reporting directly in editor (needs display and full parsing)
const SCRIPT = new Scripting(false);
export class CodeEditor extends HTMLElement {
    #textarea;
    #pre;
    #code;

    #value;

    constructor() {
        super();
    }
    
    connectedCallback() {
        // Added to document
        
        // Defaults
        const placeholder = this.getAttribute("placeholder") || "";
        const value = this.getAttribute("value") || this.innerHTML || "";
        
        this.innerHTML = ""; // Clear Content
        
        // Create Textarea
        this.#textarea = document.createElement("textarea");
        this.#textarea.placeholder = placeholder;
        this.#textarea.value = value;
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
        this.#code.innerText = value;
        
        this.#pre = document.createElement("pre");
        this.#pre.setAttribute("aria-hidden", "true"); // Hide for screen readers
        this.#pre.append(this.#code);
        this.append(this.#pre);
    }

    update(value) {
        // Update code
        this.#textarea.value = value;
        this.#value = value;

        // Syntax Highlight
        const scriptMarker = '?SCRIPT?\n';
        if(value.startsWith(scriptMarker)) {
            value = value.substring(scriptMarker.length);

            const tokens = SCRIPT.tokenize(value, true);
            const converted = [];
            for(const token of tokens) {
                if(token.type == EOF) break; // stop at EOF (and do NOT include it)

                const lexeme = token.lexeme.replace(/&/g, '&amp;').replace(/</g, '&lt;');
                if(token.type.description) {
                    converted.push(`<span class="token ${token.type.description}">${lexeme}</span>`);
                } else {
                    converted.push(lexeme);
                }
            }
            this.#code.innerHTML = scriptMarker + converted.join('') + '\n'; // NOTE: extra \n required to "stay in sync" with textarea
        } else {
            this.#code.textContent = value + '\n'; // NOTE: extra \n required to "stay in sync" with textarea
        }
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        switch(name) {
        case "value":
            this.update(newValue);
            break;
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
        return ["value", "placeholder"];
    }
} 

customElements.define("code-editor", CodeEditor);
