import { EditorList } from '../../gui/editor-list.js';
import { AccessPropertyEditor } from '../../gui/property-editor/access-property-editor.js';
import { BooleanPropertyEditor } from '../../gui/property-editor/boolean-property-editor.js';
import { ColorPropertyEditor } from '../../gui/property-editor/color-property-editor.js';
import { DoublePropertyEditor } from '../../gui/property-editor/double-property-editor.js';
import { EffectPropertyEditor } from '../../gui/property-editor/effect-property-editor.js';
import { LayerPropertyEditor } from '../../gui/property-editor/layer-property-editor.js';
import { LightPropertyEditor } from '../../gui/property-editor/light-property-editor.js';
import { LongPropertyEditor } from '../../gui/property-editor/long-property-editor.js';
import { StringFilePropertyEditor } from '../../gui/property-editor/special/string-file-property-editor.js';
import { StringPropertyEditor } from '../../gui/property-editor/string-property-editor.js';

export class CanvasWindowEditCustom {
    #editorList;

    constructor(w, reference) {
        // create and register one "tab"/EditorList to manage the editors
        this.#editorList = new EditorList(reference, w);
        w.tabs = [this.#editorList];
    }

    registerEditor(editor, autoUpdate = false) {
        this.#editorList.registerEditor(editor, autoUpdate);
    }

    // Basic Property Editors
    createBooleanEditor(property, label, className = '') {
        const editor = new BooleanPropertyEditor(property, label);
        this.#editorList.registerEditor(editor, true);

        if (className) editor.container.className = className;
        return editor.container;
    }

    createLongEditor(property, label, className = '') {
        const editor = new LongPropertyEditor(property, label);
        this.#editorList.registerEditor(editor, true);

        if (className) editor.container.className = className;
        return editor.container;
    }

    createDoubleEditor(property, label, className = '') {
        const editor = new DoublePropertyEditor(property, label);
        this.#editorList.registerEditor(editor, true);

        if (className) editor.container.className = className;
        return editor.container;
    }

    createStringEditor(property, label, placeholder = '', className = '') {
        const editor = new StringPropertyEditor(property, label, placeholder);
        this.#editorList.registerEditor(editor);

        if (className) editor.container.className = className;
        return editor.container;
    }

    createLayerEditor(property, label, className = '') {
        const editor = new LayerPropertyEditor(property, label);
        this.#editorList.registerEditor(editor, true);

        if (className) editor.container.className = className;
        return editor.container;
    }

    createLightEditor(property, label, className = '') {
        const editor = new LightPropertyEditor(property, label);
        this.#editorList.registerEditor(editor, true);

        if (className) editor.container.className = className;
        return editor.container;
    }

    createEffectEditor(property, label, className = '') {
        const editor = new EffectPropertyEditor(property, label);
        this.#editorList.registerEditor(editor, true);

        if (className) editor.container.className = className;
        return editor.container;
    }

    createColorEditor(property, label, className = '') {
        const editor = new ColorPropertyEditor(property, label);
        this.#editorList.registerEditor(editor, true);

        if (className) editor.container.className = className;
        return editor.container;
    }

    createFileEditor(property, filetype, label, className = '') {
        const editor = new StringFilePropertyEditor(property, label, filetype);
        this.#editorList.registerEditor(editor, true);

        if (className) editor.container.className = className;
        return editor.container;
    }

    createAccessEditor(property, allowedValues, label, className = '') {
        const editor = new AccessPropertyEditor(property, label, allowedValues);
        this.#editorList.registerEditor(editor, true);

        if (className) editor.container.className = className;
        return editor.container;
    }

    // Advanced Layout Components
    createValueContainer(name, onclick) {
        const li = document.createElement('li');
        li.className = 'edit-window-value-container';

        const nameP = document.createElement('p');
        nameP.innerText = name;
        if (onclick) {
            nameP.className = 'edit-window-clickable';
            nameP.onclick = onclick;
        }
        li.appendChild(nameP);

        return li;
    }
}
