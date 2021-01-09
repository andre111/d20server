import { CanvasWindow } from '../canvas-window.js';

export class CanvasWindowInput extends CanvasWindow {
    constructor(title, text, value, callback) {
        super(title, true);
        
        // create html elements
        this.frame.appendChild(document.createTextNode(text));
        
        var input = document.createElement('input');
        input.type = 'text';
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
