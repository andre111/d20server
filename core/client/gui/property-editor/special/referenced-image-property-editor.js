import { PropertyEditor } from '../property-editor.js';
import { GuiUtils } from '../../../util/guiutil.js';

import { Type } from '../../../../common/constants.js';
import { EntityManagers } from '../../../../common/entity/entity-managers.js';

export class ReferencedImagePropertyEditor extends PropertyEditor {
    constructor(tab, name, label, referenceType, referenceProperty) {
        super(name, Type.LONG, label);
        
        this.referenceType = referenceType;
        this.referenceProperty = referenceProperty;
    }
    
    initContent(label) {
        GuiUtils.makeBordered(this.container, label);
        
        this.image = document.createElement('image');
        this.container.appendChild(this.image);
        
        return this.image;
    }
    
    reloadValue(property) {
        var imageID = 0;
        var referencedEntity = EntityManagers.get(this.referenceType).find(property.getLong());
        if(referencedEntity != null && referencedEntity != undefined) {
            imageID = referencedEntity.prop(this.referenceProperty).getLong();
        }
        
        // replace image (just changing the src is not enough)
        if(this.image != null) this.container.removeChild(this.image);
        if(imageID > 0) {
            this.image = new Image();
            this.image.src = '/image/'+imageID;
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
