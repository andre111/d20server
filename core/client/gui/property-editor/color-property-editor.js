import { PropertyEditor } from './property-editor.js';
import { Type } from '../../../common/constants.js';

export class ColorPropertyEditor extends PropertyEditor {
    constructor(name, label) {
        super(name, Type.COLOR, label);
    }
    
    initContent(label) {
        this.input = document.createElement('input');
        this.input.type = 'color';
        this.container.appendChild(this.input);
        if(label) this.addLabel(label);
        
        this.input.onchange = () => this.onChange();
        
        return this.input;
    }
    
    reloadValue(reference, name) {
        this.input.value = reference.getColor(name);
    }
    
    applyValue(reference, name) {
        reference.setColor(name, this.input.value);
    }
}
