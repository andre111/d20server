import { CanvasWindow } from '../canvas-window.js';

export class CanvasWindowImage extends CanvasWindow {
    constructor(imageID) {
        super('Image', false);
        
        // TODO: create html elements
        var image = new Image();
        image.src = '/image/'+imageID;
        image.style.width = '100%';
        image.style.height = '100%';
        image.style.objectFit = 'contain';
        this.frame.appendChild(image);
        
        this.frame.style.overflow = 'hidden';
        
        this.maximize();
    }
}
