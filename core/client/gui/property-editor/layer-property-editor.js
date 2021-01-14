import { PropertyEditor } from './property-editor.js';
import { Type, Layer } from '../../../common/constants.js';

export class LayerPropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
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
        this.addLabel(label);
        
        this.select.onchange = () => this.onChange();
        
        return this.select;
    }
    
    reloadValue(property) {
        this.select.value = property.getLayer();
    }
    
    applyValue(property) {
        property.setLayer(this.select.value);
    }
}