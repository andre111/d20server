import { I18N } from '../../../common/util/i18n.js';
import { CanvasWindow } from '../canvas-window.js';

export class CanvasWindowColorInput extends CanvasWindow {
    constructor(parent, title, value, callback) {
        super(parent, title, true);

        // create html elements
        const input = document.createElement('input');
        input.type = 'color';
        input.value = value;
        this.content.appendChild(input);

        this.addButton(I18N.get('global.ok', 'Ok'), () => {
            callback(input.value);
            this.close();
        });
        this.addButton(I18N.get('global.cancel', 'Cancel'), () => {
            this.close();
        });
        this.setDimensions(300, 100);
        this.center();

        // focus main input
        input.focus();
    }
}
