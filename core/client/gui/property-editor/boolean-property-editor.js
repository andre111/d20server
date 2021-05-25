import { PropertyEditor } from './property-editor.js';
import { Type } from '../../../common/constants.js';

export class BooleanPropertyEditor extends PropertyEditor {
    #checked;

    constructor(name, label) {
        super(name, Type.BOOLEAN, label);
    }
    
    initContent(label) {
        this.checkBox = document.createElement('a');
        this.checkBox.className = 'checkbox';
        const icon = document.createElement('p');
        icon.style.backgroundSize = 'contain'; //TODO: why does this only work when "inlined"/directly applied to the element but not with css
        this.checkBox.appendChild(icon);
        this.container.appendChild(this.checkBox);
        if(label) this.addLabel(label);
        
        this.checkBox.onclick = () => {
            if(this.checkBox.disabled) return;

            this.checked = !this.checked;
            this.onChange();
        };
        
        return this.checkBox;
    }
    
    reloadValue(reference, name) {
        this.checked = reference.getBoolean(name);
    }
    
    applyValue(reference, name) {
        reference.setBoolean(name, this.checked);
    }

    get checked() {
        return this.#checked;
    }

    set checked(value) {
        this.#checked = value;
        if(value) this.checkBox.className = 'checkbox checked';
        else this.checkBox.className = 'checkbox';
    }
}
