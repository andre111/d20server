import { PropertyEditor } from '../property-editor.js';
import { Type } from '../../../../common/constants.js';

export class StringSelectionPropertyEditor extends PropertyEditor {
    constructor(tab, name, label, values) {
        super(name, Type.STRING, label);
        
        // load values
        for(const [key, value] of Object.entries(values)) {
            var option = document.createElement('option');
            option.value = key;
            option.innerHTML = value;
            this.select.appendChild(option);
        }
    }
    
    initContent(label) {
        this.select = document.createElement('select');
        this.container.appendChild(this.select);
        this.addLabel(label);
        
        this.select.onChange = () => this.onChange();
        
        return this.select;
    }
    
    reloadValue(property) {
        this.select.value = property.getString();
    }
    
    applyValue(property) {
        property.setString(this.select.value);
    }
}
