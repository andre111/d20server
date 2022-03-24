// @ts-check
import { PropertyEditor } from '../property-editor.js';

import { Type } from '../../../../common/constants.js';

export class MultiLineStringPropertyEditor extends PropertyEditor {
    constructor(name, label) {
        super(name, Type.STRING, label);
    }

    initContent(label) {
        this.textArea = document.createElement('textarea');
        this.textArea.style.width = '100%';
        this.textArea.style.height = '100%';
        this.textArea.style.overflow = 'auto';
        this.textArea.style.resize = 'none';
        this.textArea.style.fontFamily = 'monospace';
        this.container.appendChild(this.textArea);

        this.textArea.onchange = () => this.onChange();

        return this.textArea;
    }

    reloadValue(reference, name) {
        this.textArea.value = reference.getString(name);
    }

    applyValue(reference, name) {
        reference.setString(name, this.textArea.value);
    }
}
