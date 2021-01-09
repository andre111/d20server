import { PropertyEditor } from './property-editor.js';
import { Type } from '../../../common/constants.js';

export class BooleanPropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.BOOLEAN, label);
        
        /* override default style size TODO: make this use css aswell */
        this.checkBox.style.width = this.checkBox.style.height = '24px';
    }
    
    initContent(label) {
        this.checkBox = document.createElement('input');
        this.checkBox.type = 'checkbox';
        this.checkBox.style.margin = '0';
        this.container.appendChild(this.checkBox);
        this.addLabel(label);
        
        this.checkBox.onchange = () => this.onChange();
        
        return this.checkBox;
    }
    
    reloadValue(property) {
        this.checkBox.checked = property.getBoolean();
    }
    
    applyValue(property) {
        property.setBoolean(this.checkBox.checked);
    }
}
