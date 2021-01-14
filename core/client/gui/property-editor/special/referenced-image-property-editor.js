import { PropertyEditor } from '../property-editor.js';
import { GuiUtils } from '../../../util/guiutil.js';

import { Type } from '../../../../common/constants.js';

export class ReferencedImagePropertyEditor extends PropertyEditor {
    constructor(tab, name, label, referenceProperty) {
        super(name, Type.STRING, label);
        
        this.referenceProperty = referenceProperty;
    }
    
    initContent(label) {
        GuiUtils.makeBordered(this.container, label);
        
        this.image = document.createElement('image');
        this.container.appendChild(this.image);
        
        return this.image;
    }
    
    reloadValue(property) {
        var imagePath = '';
        const referencedEntity = property.getEntity();
        if(referencedEntity) {
            imagePath = referencedEntity.prop(this.referenceProperty).getString();
        }
        
        // replace image (just changing the src is not enough)
        if(this.image != null) this.container.removeChild(this.image);
        if(imagePath && imagePath != '') {
            this.image = new Image();
            this.image.src = '/data/files'+imagePath;
            this.image.style.width = '100%';
            this.image.style.height = '100%';
            this.image.style.objectFit = 'contain';
            this.container.appendChild(this.image);
        } else {
            this.image = null;
        }
    }
    
    applyValue(property) {
    }
}
