import { PropertyEditor } from '../property-editor.js';
import { Type } from '../../../../common/constants.js';
import { createDefaultFileManager } from '../../../canvas/window/canvas-window-filemanager.js';

export class StringFilePropertyEditor extends PropertyEditor {
    constructor(tab, name, label, filetype) {
        super(name, Type.STRING, label);
        
        this.filetype = filetype;
        this.currentString = '';
    }
    
    initContent(label) {
        this.button = document.createElement('button');
        this.button.onclick = () => this.doSelectFile();
        this.button.oncontextmenu = () => this.doClearFile();
        this.container.appendChild(this.button);
        return this.button;
    }
    
    reloadValue(property) {
        this.currentString = property.getString();
        this.updateButtonText();
    }
    
    applyValue(property) {
        property.setString(this.currentString);
    }
    
    updateButtonText() {
        this.button.innerHTML = this.currentString;
    }
    
    doSelectFile() {
        const manager = createDefaultFileManager();
        manager.init(file => {
            if(!file) return;
            if(file.getType() == this.filetype) {
                this.currentString = file.getPath();
                this.updateButtonText();

                manager.close();
            }
        });
    }

    doClearFile() {
        this.currentString = '';
        this.updateButtonText();
    }
}
