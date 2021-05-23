import { State } from "./state.js";
import { GuiUtils } from '../util/guiutil.js';

export class StateDisconnected extends State {
    #error;

    constructor(error) {
        super();

        this.#error = error;
    }

    init() {
        // create div
        const div = document.createElement('div');
        div.id = 'disconnected';
        div.className = 'full-overlay';
        GuiUtils.makeFancyBG(div);
        document.body.appendChild(div);

        // create elements
        if(this.#error) {
            const fieldset = GuiUtils.createBorderedSet('Error', '400px', 'auto');
            fieldset.appendChild(document.createTextNode('Encountered an error, please report the trace below and reload...'));
            const errorP = document.createElement('p');
            errorP.className = 'error-trace';
            errorP.innerText = this.#error.stack;
            fieldset.appendChild(errorP);
            div.appendChild(fieldset);
        } else {
            const fieldset = GuiUtils.createBorderedSet('Disconnected', '400px', 'auto');
            fieldset.appendChild(document.createTextNode('Lost connection to server, please reload...'));
            div.appendChild(fieldset);
        }
    }

    exit() {
        const div = document.getElementById('disconnected');
        div.parentElement.removeChild(div);
    }
}
