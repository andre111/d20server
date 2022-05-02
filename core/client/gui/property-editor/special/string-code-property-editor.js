// @ts-check
import { PropertyEditor } from '../property-editor.js';
import { CodeEditor } from '../../../html/code-editor.js';

import { Type } from '../../../../common/constants.js';

export class StringCodePropertyEditor extends PropertyEditor {
    constructor(name, label) {
        super(name, Type.STRING, label);
    }

    initContent(label) {
        this.container.style.overflow = 'auto';
        this.container.style.height = 'calc(100% - 18px)';

        this.editor = new CodeEditor();
        this.editor.style.width = '100%';
        this.editor.style.height = '100%';
        this.editor.style.border = 'none';
        this.container.appendChild(this.editor);

        // functionality
        this.editor.onkeyup = () => {
            this.onChange();
        };

        return this.editor;
    }

    reloadValue(reference, name) {
        this.editor.value = reference.getString(name);
    }

    applyValue(reference, name) {
        reference.setString(name, this.editor.value);
    }
}
