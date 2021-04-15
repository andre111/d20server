import { CanvasWindow } from '../canvas-window.js';

export class CanvasWindowText extends CanvasWindow {
    constructor(title, text) {
        super(title, false);
        
        // create html elements
        const p = document.createElement('p');
        p.innerText = text;
        this.frame.appendChild(p);
        
        this.frame.style.overflow = 'auto';
        
        this.setLocation({
            position: { my: 'center', at: 'center' },
            width: 300,
            height: 300
        });
    }
}
