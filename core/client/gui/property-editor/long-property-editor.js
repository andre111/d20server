// @ts-check
import { PropertyEditor } from './property-editor.js';
import { Type } from '../../../common/constants.js';

export class LongPropertyEditor extends PropertyEditor {
    constructor(name, label) {
        super(name, Type.LONG, label);
    }

    initContent(label) {
        this.spinner = document.createElement('input');
        this.spinner.type = 'number';
        this.container.appendChild(this.spinner);
        this.addLabel(label);

        this.spinner.onchange = () => this.onChange();

        return this.spinner;
    }

    reloadValue(reference, name) {
        this.spinner.value = reference.getLong(name);
    }

    applyValue(reference, name) {
        var value = this.spinner.valueAsNumber;
        if (value != NaN) reference.setLong(name, Math.trunc(value));
    }
}
