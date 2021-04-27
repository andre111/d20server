import { PropertyEditor } from './property-editor.js';
import { Type, Layer } from '../../../common/constants.js';

export class LayerPropertyEditor extends PropertyEditor {
    constructor(name, label) {
        super(name, Type.LAYER, label);
    }
    
    initContent(label) {
        this.select = document.createElement('select');
        const values = [ Layer.BACKGROUND, Layer.MAIN, Layer.GMOVERLAY ];
        for(const value of values) {
            var option = document.createElement('option');
            option.value = value;
            option.innerHTML = value;
            this.select.appendChild(option);
        }
        this.container.appendChild(this.select);
        if(label) this.addLabel(label);
        
        this.select.onchange = () => this.onChange();
        
        return this.select;
    }
    
    reloadValue(reference, name) {
        this.select.value = reference.getLayer(name);
    }
    
    applyValue(reference, name) {
        reference.setLayer(name, this.select.value);
    }
}
