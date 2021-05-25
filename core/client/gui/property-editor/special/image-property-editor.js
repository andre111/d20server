import { PropertyEditor } from '../property-editor.js';
import { createDefaultFileManager } from '../../../canvas/window/canvas-window-filemanager.js';

import { Type } from '../../../../common/constants.js';
import { FILE_TYPE_IMAGE } from '../../../../common/util/datautil.js';

export class ImagePropertyEditor extends PropertyEditor {
    constructor(name, label) {
        super(name, Type.STRING, label);
        
        this.imagePath = '';
    }
    
    initContent(label) {
        this.image = document.createElement('img');
        this.image.className = 'image-editor';
        this.image.style.width = '100%';
        this.image.style.height = '100%';
        this.image.style.objectFit = 'contain';

        this.container.onclick = () => this.doEditImage();
        this.container.oncontextmenu = () => this.doClearImage();
        this.container.appendChild(this.image);
        
        return this.image;
    }
    
    reloadValue(reference, name) {
        this.imagePath = reference.getString(name);
        this.reloadImage();
    }
    
    applyValue(reference, name) {
        reference.setString(name, this.imagePath);
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
        if(!this.image.disabled) {
            const manager = createDefaultFileManager(this.imagePath, this.window);
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
        if(!this.image.disabled) {
            this.imagePath = '';
            this.reloadImage();
            this.onChange();
        }
    }
}
