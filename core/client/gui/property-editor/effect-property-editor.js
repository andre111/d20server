import { PropertyEditor } from './property-editor.js';
import { Type, Effect } from '../../../common/constants.js';

export class EffectPropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.EFFECT, label);
    }
    
    initContent(label) {
        this.select = document.createElement('select');
        const values = [ Effect.NONE, Effect.FOG, Effect.RAIN_LIGHT, Effect.RAIN_HEAVY, Effect.RAIN_STORM, Effect.SNOW ];
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
        this.select.value = property.getEffect();
    }
    
    applyValue(property) {
        property.setEffect(this.select.value);
    }
}
