import { CanvasWindow } from '../canvas-window.js';

export class CanvasWindowColorInput extends CanvasWindow {
    constructor(title, value, callback) {
        super(title, true);
        
        // create html elements
        var input = document.createElement('input');
        input.type = 'color';
        input.value = value;
        this.frame.appendChild(input);
        
        $(this.frame).dialog('option', 'buttons', [
            {
                text: 'Ok',
                click: function() {
                    callback(input.value);
                    $(this).dialog('close');
                }
            },
            {
                text: 'Cancel',
                click: function() {
                    $(this).dialog('close');
                }
            }
        ]);
        
        // focus main input
        input.focus();
    }
}
