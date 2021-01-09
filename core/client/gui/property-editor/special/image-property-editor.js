import { PropertyEditor } from '../property-editor.js';
import { GuiUtils } from '../../../util/guiutil.js';
import { CanvasWindowChoose } from '../../../canvas/window/canvas-window-choose.js';

import { Type } from '../../../../common/constants.js';

export class ImagePropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.LONG, label);
        
        this.imageID = -1;
    }
    
    initContent(label) {
        GuiUtils.makeBordered(this.container, label);
        
        this.image = document.createElement('image');
        this.container.onclick = () => this.doEditImage();
        this.container.appendChild(this.image);
        
        this.input = document.createElement('input');
        
        return this.input;
    }
    
    reloadValue(property) {
        this.imageID = property.getLong();
        this.reloadImage();
    }
    
    applyValue(property) {
        property.setLong(this.imageID);
    }
    
    reloadImage() {
        // replace image (just changing the src is not enough)
        if(this.image != null) this.container.removeChild(this.image);
        if(this.imageID > 0) {
            this.image = new Image();
            this.image.src = '/image/'+this.imageID;
            this.image.style.width = '100%';
            this.image.style.height = '100%';
            this.image.style.objectFit = 'contain';
            this.container.appendChild(this.image);
        } else {
            this.image = null;
        }
    }
    
    doEditImage() {
        if(!this.input.disabled) {
            new CanvasWindowChoose('image', null, id => {
                this.imageID = id;
                this.reloadImage();
            });
        }
    }
}
