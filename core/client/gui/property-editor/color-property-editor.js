import { PropertyEditor } from './property-editor.js';
import { Type } from '../../../common/constants.js';

export class ColorPropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.COLOR, label);
    }
    
    initContent(label) {
        this.input = document.createElement('input');
        this.input.type = 'color';
        this.container.appendChild(this.input);
        this.addLabel(label);
        
        this.input.onchange = () => this.onChange();
        
        return this.input;
    }
    
    reloadValue(property) {
        this.input.value = property.getColor();
    }
    
    applyValue(property) {
        property.setColor(this.input.value);
    }
}