import { I18N } from '../../../common/util/i18n.js';
import { CanvasWindow } from '../canvas-window.js';

export class CanvasWindowImage extends CanvasWindow {
    constructor(parent, imagePath) {
        super(parent, I18N.get('window.image', 'Image'), false);
        
        // create html elements
        const image = new Image();
        image.src = imagePath;
        image.style.width = '100%';
        image.style.height = '100%';
        image.style.objectFit = 'contain';
        this.content.appendChild(image);
        
        this.content.style.overflow = 'hidden';
        
        this.maximize();
    }
}
