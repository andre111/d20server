import { I18N } from '../../common/util/i18n.js';
import { isString } from '../../common/util/stringutil.js';
import { SETTING_SHOW_CONTROLLS_BAR } from '../settings/settings.js';

export class ControllsBar {
    #container;

    constructor() {
        this.#container = document.createElement('div');
        this.#container.id = 'controllsbar';
        document.body.appendChild(this.#container);

        // listen to setting
        this.#setVisibility();
        SETTING_SHOW_CONTROLLS_BAR.addListener(() => this.#setVisibility());
    }

    clearHints() {
        this.#container.innerHTML = '';
    }

    //TODO: convert to doc
    // controlls is either:
    //    a string: single input in the form of 'mouse-...' or 'key-...'
    //    a list of strings: input combination
    //    a list of lists: alternative input combinations
    addHint(controlls, i18nKey) {
        const div = document.createElement('div');

        // convert 'easy input' forms to full structure of two nested arrays
        if (isString(controlls)) {
            controlls = [[controlls]];
        } else if (Array.isArray(controlls) && isString(controlls[0])) {
            controlls = [controlls];
        }

        // loop all controll alternatives
        for (var i = 0; i < controlls.length; i++) {
            const controll = controlls[i];
            // loop all required inputs
            for (var j = 0; j < controll.length; j++) {
                // build input element
                const input = controll[j];
                if (input.startsWith('mouse-')) {
                    const mouse = document.createElement('mouse');
                    mouse.setAttribute('button', input.substring(6));
                    div.appendChild(mouse);
                } else if (input.startsWith('key-')) {
                    const key = document.createElement('key');
                    key.innerText = input.substring(4);
                    div.appendChild(key);
                }

                // add + to combine inputs
                if (j < controll.length - 1) div.appendChild(document.createTextNode('+'));
            }
            // add / to sepparate alternatives
            if (i < controlls.length - 1) div.appendChild(document.createTextNode('/'));
        }

        // add description
        div.appendChild(document.createTextNode(I18N.get(i18nKey, i18nKey)));

        this.#container.appendChild(div);
    }

    remove() {
        document.body.removeChild(this.#container);
    }

    #setVisibility() {
        this.#container.style.visibility = SETTING_SHOW_CONTROLLS_BAR.value ? 'visible' : 'hidden';
    }
}
