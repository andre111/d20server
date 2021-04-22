import { CanvasWindow } from '../canvas-window.js';

export class CanvasWindowConfirm extends CanvasWindow {
    constructor(title, text, callback) {
        super(title, true);
        
        // create html elements
        this.content.appendChild(document.createTextNode(text));
        
        this.addButton('Yes', () => {
            callback();
            this.close();
        });
        this.addButton('No', () => {
            this.close();
        });
        this.setDimensions(300, 200);
        this.center();
    }
}
