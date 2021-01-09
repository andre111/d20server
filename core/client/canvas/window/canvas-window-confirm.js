import { CanvasWindow } from '../canvas-window.js';

export class CanvasWindowConfirm extends CanvasWindow {
    constructor(title, text, callback) {
        super(title, true);
        
        // create html elements
        this.frame.appendChild(document.createTextNode(text));
        
        $(this.frame).dialog('option', 'buttons', [
            {
                text: 'Yes',
                click: function() {
                    callback();
                    $(this).dialog('close');
                }
            },
            {
                text: 'No',
                click: function() {
                    $(this).dialog('close');
                }
            }
        ]);
    }
}
