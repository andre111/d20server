// @ts-check
import { I18N } from '../../../common/util/i18n.js';
import { CanvasWindow } from '../canvas-window.js';

export class CanvasWindowConfirm extends CanvasWindow {
    constructor(parent, title, text, callback) {
        super(parent, title, true);

        // create html elements
        this.content.appendChild(document.createTextNode(text));

        this.addButton(I18N.get('global.yes', 'Yes'), () => {
            callback();
            this.close();
        });
        this.addButton(I18N.get('global.no', 'No'), () => {
            this.close();
        });
        this.setDimensions(300, 200);
        this.center();
    }
}
