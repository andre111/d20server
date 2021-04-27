import { PropertyEditor } from './property-editor.js';
import { Type, Light } from '../../../common/constants.js';

export class LightPropertyEditor extends PropertyEditor {
    constructor(name, label) {
        super(name, Type.LIGHT, label);
    }
    
    initContent(label) {
        this.select = document.createElement('select');
        const values = [ Light.DARK, Light.DIM, Light.BRIGHT ];
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
        this.select.value = reference.getLight(name);
    }
    
    applyValue(reference, name) {
        reference.setLight(name, this.select.value);
    }
}
