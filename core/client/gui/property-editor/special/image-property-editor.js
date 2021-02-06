import { PropertyEditor } from '../property-editor.js';
import { GuiUtils } from '../../../util/guiutil.js';
import { createDefaultFileManager } from '../../../canvas/window/canvas-window-filemanager.js';

import { Type } from '../../../../common/constants.js';

export class ImagePropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.STRING, label);
        
        this.imagePath = '';
    }
    
    initContent(label) {
        GuiUtils.makeBordered(this.container, label);
        
        this.image = document.createElement('image');
        this.container.onclick = () => this.doEditImage();
        this.container.oncontextmenu = () => this.doClearImage();
        this.container.appendChild(this.image);
        
        this.input = document.createElement('input');
        
        return this.input;
    }
    
    reloadValue(property) {
        this.imagePath = property.getString();
        this.reloadImage();
    }
    
    applyValue(property) {
        property.setString(this.imagePath);
    }
    
    reloadImage() {
        // replace image (just changing the src is not enough)
        if(this.image != null) this.container.removeChild(this.image);
        if(this.imagePath != '') {
            this.image = new Image();
            this.image.src = '/data/files'+this.imagePath;
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
            const manager = createDefaultFileManager(this.imagePath);
            manager.init(file => {
                if(!file) return;
                if(file.getType() == 'image') {
                    this.imagePath = file.getPath();
                    this.reloadImage();
                    this.onChange();

                    manager.close();
                }
            });
        }
    }

    doClearImage() {
        if(!this.input.disabled) {
            this.imagePath = '';
            this.reloadImage();
            this.onChange();
        }
    }
}
