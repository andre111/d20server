import { PropertyEditor } from './property-editor.js';
import { Type } from '../../../common/constants.js';

export class StringPropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.STRING, label);
    }
    
    initContent(label) {
        this.textField = document.createElement('input');
        this.textField.type = 'text';
        this.container.appendChild(this.textField);
        this.addLabel(label);
        
        this.textField.onchange = () => this.onChange();
        
        return this.textField;
    }
    
    reloadValue(property) {
        this.textField.value = property.getString();
    }
    
    applyValue(property) {
        property.setString(this.textField.value);
    }
}
