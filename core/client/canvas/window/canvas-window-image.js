import { CanvasWindow } from '../canvas-window.js';

export class CanvasWindowImage extends CanvasWindow {
    constructor(imagePath) {
        super('Image', false);
        
        // create html elements
        var image = new Image();
        image.src = imagePath;
        image.style.width = '100%';
        image.style.height = '100%';
        image.style.objectFit = 'contain';
        this.frame.appendChild(image);
        
        this.frame.style.overflow = 'hidden';
        
        this.maximize();
    }
}
