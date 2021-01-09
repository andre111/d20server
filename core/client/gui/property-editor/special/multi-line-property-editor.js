import { PropertyEditor } from '../property-editor.js';
import { GuiUtils } from '../../../util/guiutil.js';

import { Type } from '../../../../common/constants.js';

export class MultiLineStringPropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.STRING, label);
    }
    
    initContent(label) {
        GuiUtils.makeBordered(this.container, label);
        
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
    
    reloadValue(property) {
        this.textArea.value = property.getString();
    }
    
    applyValue(property) {
        property.setString(this.textArea.value);
    }
}
