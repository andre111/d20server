import { PropertyEditor } from './property-editor.js';
import { Type, Access } from '../../../common/constants.js';

export class AccessPropertyEditor extends PropertyEditor {
    constructor(name, label) {
        super(name, Type.ACCESS, label);
    }
    
    initContent(label) {
        this.select = document.createElement('select');
        const values = [ Access.EVERYONE, Access.CONTROLLING_PLAYER, Access.GM ];
        for(const value of values) {
            var option = document.createElement('option');
            option.value = value;
            option.innerHTML = value;
            this.select.appendChild(option);
        }
        this.container.appendChild(this.select);
        this.addLabel(label);
        
        this.select.onchange = () => this.onChange();
        
        return this.select;
    }
    
    reloadValue(reference, name) {
        this.select.value = reference.getAccessValue(name);
    }
    
    applyValue(reference, name) {
        reference.setAccessValue(name, this.select.value);
    }
}
