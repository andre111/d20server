import { PropertyEditor } from './property-editor.js';
import { Type } from '../../../common/constants.js';

export class DoublePropertyEditor extends PropertyEditor {
    constructor(name, label) {
        super(name, Type.DOUBLE, label);
    }

    initContent(label) {
        this.spinner = document.createElement('input');
        this.spinner.type = 'number';
        this.container.appendChild(this.spinner);
        if (label) this.addLabel(label);

        this.spinner.onchange = () => this.onChange();

        return this.spinner;
    }

    reloadValue(reference, name) {
        this.spinner.value = reference.getDouble(name);
    }

    applyValue(reference, name) {
        var value = this.spinner.valueAsNumber;
        if (value != NaN) reference.setDouble(name, value);
    }
}
