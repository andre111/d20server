import { EditorList } from '../../gui/editor-list.js';
import { createPropertyEditor } from '../../gui/property-editors.js';

export class CanvasWindowEditEntityTabProperties extends EditorList {
    constructor(w, container, propertyDefinitions) {
        super(w.getReference());
        
        // create tab panel
        var panel = document.createElement('div');
        panel.style.width = '100%';
        panel.style.height = '100%';
        panel.style.overflow = 'auto';
        panel.name = 'Properties';
        container.appendChild(panel);
        
        this.w = w;
        this.initContent(panel, propertyDefinitions);
    }
    
    initContent(content, propertyDefinitions) {
        // TODO: make this better
        for(const propDefinition of propertyDefinitions) {
            try {
                const editor = createPropertyEditor(propDefinition.type, propDefinition.name, propDefinition.name);
                editor.setForceDisable(true);
                this.registerEditor(editor, propDefinition.type != 'STRING');
                content.appendChild(editor.getContainer());
            } catch(e) {}
        }
    }
}
