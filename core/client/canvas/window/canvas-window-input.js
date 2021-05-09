import { I18N } from '../../../common/util/i18n.js';
import { CanvasWindow } from '../canvas-window.js';

export class CanvasWindowInput extends CanvasWindow {
    constructor(parent, title, text, value, callback) {
        super(parent, title, true);
        
        // create html elements
        this.content.appendChild(document.createTextNode(text));
        
        const input = document.createElement('input');
        input.type = 'text';
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
        
        // make pressing enter in input confirm the dialog as well
        input.onkeydown = e => {
            if(e.keyCode == 13) {
                callback(input.value); 
                this.close();
            }
        };
        
        // focus main input
        requestAnimationFrame(() => {
            input.focus();
            input.select();
        });
    }
}
