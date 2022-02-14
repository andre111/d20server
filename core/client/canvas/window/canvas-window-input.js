import { I18N } from '../../../common/util/i18n.js';
import { CanvasWindow } from '../canvas-window.js';

export class CanvasWindowInput extends CanvasWindow {
    #inputs = [];
    #callback;

    constructor(parent, title, text, value, callback) {
        super(parent, title, true);

        this.#callback = callback;

        // create html elements
        const textDiv = document.createElement('div');
        textDiv.innerText = text;
        this.content.appendChild(textDiv);
        this.content.classList.add('flexcol', 'flexnowrap');

        this.addInput('text', value, 'input.value', 'Value: ', true);

        this.addButton(I18N.get('global.ok', 'Ok'), () => {
            this.onConfirm();
        });
        this.addButton(I18N.get('global.cancel', 'Cancel'), () => {
            this.close();
        });
        this.setDimensions(300, 120);
        this.center();

        // focus main input
        requestAnimationFrame(() => {
            this.#inputs[this.#inputs.length - 1].focus();
            this.#inputs[this.#inputs.length - 1].select();
        });
    }

    addInput(type, value, i18nKey, text, confirmOnEnter = true) {
        const div = document.createElement('div');
        div.style.display = 'grid';
        div.style.gridTemplateColumns = '120px 170px';

        div.appendChild(document.createTextNode(I18N.get(i18nKey, text)));

        const input = document.createElement('input');
        input.type = type;
        input.value = value;
        div.appendChild(input);
        this.#inputs.push(input);

        this.content.appendChild(div);

        if (confirmOnEnter) {
            input.onkeydown = e => {
                if (e.keyCode == 13) this.onConfirm();
            };
        }
    }

    onConfirm() {
        this.#callback(this.#inputs[0].value);
        this.close();
    }

    get callback() {
        return this.#callback;
    }

    get inputs() {
        return this.#inputs;
    }
}
