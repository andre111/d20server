import { PropertyEditor } from '../property-editor.js';
import { GuiUtils } from '../../../util/guiutil.js';
import { createDefaultFileManager } from '../../../canvas/window/canvas-window-filemanager.js';

import { Type } from '../../../../common/constants.js';
import { FILE_TYPE_IMAGE } from '../../../../common/util/datautil.js';

export class ImagePropertyEditor extends PropertyEditor {
    constructor(name, label) {
        super(name, Type.STRING, label);
        
        this.imagePath = '';
    }
    
    initContent(label) {
        if(label) GuiUtils.makeBordered(this.container, label);

        this.image = document.createElement('img');
        this.image.style.width = '100%';
        this.image.style.height = '100%';
        this.image.style.objectFit = 'contain';

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
        if(this.imagePath) {
            this.image.src = '/data/files'+this.imagePath;
            this.image.style.visibility = 'visible';
        } else {
            this.image.style.visibility = 'hidden';
        }
    }
    
    doEditImage() {
        if(!this.input.disabled) {
            const manager = createDefaultFileManager(this.imagePath);
            manager.init(file => {
                if(!file) return;
                if(file.getType() == FILE_TYPE_IMAGE) {
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
