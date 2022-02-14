import { PropertyEditor } from '../property-editor.js';
import { Type } from '../../../../common/constants.js';
import { createDefaultFileManager } from '../../../canvas/window/canvas-window-filemanager.js';

export class StringFilePropertyEditor extends PropertyEditor {
    constructor(name, label, filetype) {
        super(name, Type.STRING, label);

        this.filetype = filetype;
        this.currentPath = '';
    }

    initContent(label) {
        this.button = document.createElement('button');
        this.button.onclick = () => this.doSelectFile();
        this.button.oncontextmenu = () => this.doClearFile();
        this.container.appendChild(this.button);
        return this.button;
    }

    reloadValue(reference, name) {
        this.currentPath = reference.getString(name);
        this.updateButtonText();
    }

    applyValue(reference, name) {
        reference.setString(name, this.currentPath);
    }

    updateButtonText() {
        this.button.innerHTML = this.currentPath;
    }

    doSelectFile() {
        const manager = createDefaultFileManager(this.currentPath, this.window);
        manager.init(file => {
            if (!file) return;
            if (file.getType().getName() == this.filetype) {
                this.currentPath = file.getPath();
                this.updateButtonText();
                this.onChange();

                manager.close();
            }
        });
    }

    doClearFile() {
        this.currentPath = '';
        this.updateButtonText();
        this.onChange();
    }
}
