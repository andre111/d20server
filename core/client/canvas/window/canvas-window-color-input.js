import { CanvasWindow } from '../canvas-window.js';

export class CanvasWindowColorInput extends CanvasWindow {
    constructor(title, value, callback) {
        super(title, true);
        
        // create html elements
        const input = document.createElement('input');
        input.type = 'color';
        input.value = value;
        this.content.appendChild(input);
        
        this.addButton('Yes', () => {
            callback(input.value);
            this.close();
        });
        this.addButton('No', () => {
            this.close();
        });
        this.setDimensions(300, 100);
        this.center();
        
        // focus main input
        input.focus();
    }
}
