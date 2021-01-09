import { PropertyEditor } from './property-editor.js';
import { Type } from '../../../common/constants.js';

export class DoublePropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.DOUBLE, label);
    }
    
    initContent(label) {
        this.spinner = document.createElement('input');
        this.spinner.type = 'number';
        this.container.appendChild(this.spinner);
        this.addLabel(label);
        
        this.spinner.onchange = () => this.onChange();
        
        return this.spinner;
    }
    
    reloadValue(property) {
        this.spinner.value = property.getDouble();
    }
    
    applyValue(property) {
        var value = this.spinner.valueAsNumber;
        if(value != NaN) property.setDouble(value);
    }
}
