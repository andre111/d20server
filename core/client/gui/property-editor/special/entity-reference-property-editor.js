import { PropertyEditor } from '../property-editor.js';
import { Type } from '../../../../common/constants.js';
import { CanvasWindowChoose } from '../../../canvas/window/canvas-window-choose.js';
import { EntityManagers } from '../../../../common/entity/entity-managers.js';

export class EntityReferencePropertyEditor extends PropertyEditor {
    constructor(tab, name, label, referenceType) {
        super(name, Type.LONG, label);
        
        this.referenceType = referenceType;
        this.currentEntityID = -1;
    }
    
    initContent(label) {
        this.button = document.createElement('button');
        this.button.onclick = () => this.doSelectEntity();
        this.container.appendChild(this.button);
        return this.button;
    }
    
    reloadValue(property) {
        this.currentEntityID = property.getLong();
        this.updateButtonText();
    }
    
    applyValue(property) {
        property.setLong(this.currentEntityID);
    }
    
    updateButtonText() {
        var entity = EntityManagers.get(this.referenceType).find(this.currentEntityID);
        this.button.innerHTML = (entity != null && entity != undefined) ? entity.getName() : '<none>';
    }
    
    doSelectEntity() {
        new CanvasWindowChoose(this.referenceType, id => {
            console.log(id);
            this.currentEntityID = id;
            this.updateButtonText();
        });
    }
}
