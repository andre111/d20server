// @ts-check
import { State } from "./state.js";
import { GuiUtils } from '../util/guiutil.js';
import { I18N } from '../../common/util/i18n.js';

export class StateDisconnected extends State {
    #code;
    #reason;
    #error;

    constructor(code, reason, error) {
        super();

        this.#code = code;
        this.#reason = reason;
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
        if (this.#error) {
            const fieldset = GuiUtils.createBorderedSet(I18N.get('state.disconnect.error', 'Error'), '400px', 'auto');
            fieldset.appendChild(document.createTextNode(I18N.get('state.disconnect.error.description', 'Encountered an error, please report the trace below and reload...')));
            const errorP = document.createElement('p');
            errorP.className = 'error-trace';
            errorP.innerText = this.#error.stack;
            fieldset.appendChild(errorP);
            div.appendChild(fieldset);
        } else {
            const fieldset = GuiUtils.createBorderedSet(I18N.get('state.disconnect', 'Disconnected'), '400px', 'auto');
            fieldset.appendChild(document.createTextNode(I18N.get('state.disconnect.description', 'Lost connection to server')));
            fieldset.appendChild(document.createElement('br'));
            fieldset.appendChild(document.createTextNode((this.#reason && this.#reason != '') ? I18N.get('state.disconnect.reason', 'Reason: %0', this.#reason) : I18N.get('state.disconnect.reload', 'Please reload...')));
            div.appendChild(fieldset);
        }
    }

    exit() {
        const div = document.getElementById('disconnected');
        div.parentElement.removeChild(div);
    }
}
