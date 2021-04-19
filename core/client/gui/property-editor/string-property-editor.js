import { PropertyEditor } from './property-editor.js';
import { Type } from '../../../common/constants.js';

export class StringPropertyEditor extends PropertyEditor {
    constructor(name, label, placeholder) {
        super(name, Type.STRING, label);

        if(placeholder) this.textField.placeholder = placeholder;
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
