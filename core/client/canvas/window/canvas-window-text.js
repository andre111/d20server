import { CanvasWindow } from '../canvas-window.js';

export class CanvasWindowText extends CanvasWindow {
    constructor(parent, title, text) {
        super(parent, title, false);

        // create html elements
        const p = document.createElement('p');
        p.innerText = text;
        this.content.appendChild(p);

        this.content.style.overflow = 'auto';

        this.setDimensions(300, 300);
        this.center();
    }
}
