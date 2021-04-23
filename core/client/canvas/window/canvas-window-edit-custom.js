import { EditorList } from '../../gui/editor-list.js';
import { BooleanPropertyEditor } from '../../gui/property-editor/boolean-property-editor.js';
import { ColorPropertyEditor } from '../../gui/property-editor/color-property-editor.js';
import { DoublePropertyEditor } from '../../gui/property-editor/double-property-editor.js';
import { LayerPropertyEditor } from '../../gui/property-editor/layer-property-editor.js';
import { LongPropertyEditor } from '../../gui/property-editor/long-property-editor.js';
import { StringFilePropertyEditor } from '../../gui/property-editor/special/string-file-property-editor.js';
import { StringPropertyEditor } from '../../gui/property-editor/string-property-editor.js';

export class CanvasWindowEditCustom {
    #editorList; 

    constructor(w, reference) {
        // create and register one "tab"/EditorList to manage the editors
        this.#editorList = new EditorList(reference);
        w.tabs = [this.#editorList];
    }

    registerEditor(editor, autoUpdate = false) {
        this.#editorList.registerEditor(editor, autoUpdate);
    }

    // Basic Property Editors
    createBooleanEditor(property, label, className = '') {
        const editor = new BooleanPropertyEditor(property, label);
        this.#editorList.registerEditor(editor, true);

        if(className) editor.getContainer().className = className;
        return editor.getContainer();
    }

    createLongEditor(property, label, className = '') {
        const editor = new LongPropertyEditor(property, label);
        this.#editorList.registerEditor(editor, true);

        if(className) editor.getContainer().className = className;
        return editor.getContainer();
    }

    createDoubleEditor(property, label, className = '') {
        const editor = new DoublePropertyEditor(property, label);
        this.#editorList.registerEditor(editor, true);

        if(className) editor.getContainer().className = className;
        return editor.getContainer();
    }
    
    createStringEditor(property, label, placeholder = '', className = '') {
        const editor = new StringPropertyEditor(property, label, placeholder);
        this.#editorList.registerEditor(editor);

        if(className) editor.getContainer().className = className;
        return editor.getContainer();
    }

    createLayerEditor(property, label, className = '') {
        const editor = new LayerPropertyEditor(property, label);
        this.#editorList.registerEditor(editor, true);

        if(className) editor.getContainer().className = className;
        return editor.getContainer();
    }

    createColorEditor(property, label, className = '') {
        const editor = new ColorPropertyEditor(property, label);
        this.#editorList.registerEditor(editor, true);

        if(className) editor.getContainer().className = className;
        return editor.getContainer();
    }

    createFileEditor(property, filetype, label, className = '') {
        const editor = new StringFilePropertyEditor(property, label, filetype);
        this.#editorList.registerEditor(editor, true);

        if(className) editor.getContainer().className = className;
        return editor.getContainer();
    }

    // Advanced Layout Components
    createValueContainer(name, onclick) {
        const li = document.createElement('li');
        li.className = 'edit-window-value-container';
        
        const nameP = document.createElement('p');
        nameP.innerText = name;
        if(onclick) {
            nameP.className = 'edit-window-clickable';
            nameP.onclick = onclick;
        }
        li.appendChild(nameP);
        
        return li;
    }
}
