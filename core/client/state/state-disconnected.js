import { State } from "./state.js";
import { GuiUtils } from '../util/guiutil.js';

export class StateDisconnected extends State {
    constructor() {
        super();
    }

    init() {
        // create div
        const div = document.createElement('div');
        div.id = 'disconnected';
        div.className = 'full-overlay';
        GuiUtils.makeFancyBG(div);
        document.body.appendChild(div);

        // create elements
        const fieldset = GuiUtils.createBorderedSet('Disconnected', '400px', 'auto');
        fieldset.appendChild(document.createTextNode('Lost connection to server, please reload...'));
        div.appendChild(fieldset);
    }

    exit() {
        const div = document.getElementById('disconnected');
        div.parentElement.removeChild(div);
    }
}
