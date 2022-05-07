// @ts-check
import { CanvasWindow } from '../canvas-window.js';
import { ServerData } from '../../server-data.js';

import { EntityReference } from '../../../common/entity/entity-reference.js';
import { I18N } from '../../../common/util/i18n.js';
import { createPropertyEditor } from '../../gui/property-editors.js';
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
import { StringSelectionPropertyEditor } from '../../gui/property-editor/special/string-selection-property-editor.js';
import { DefinitionUtils } from '../../../common/util/definitionutil.js';

export class CanvasWindowEditEntity extends CanvasWindow {
    #reference;
    #editorList;

    constructor(parent, reference) {
        super(parent, I18N.get('window.edit.title', 'Edit %0', (reference.getName() ? reference.getName() : reference.getDefinition().displayName)), true);

        this.#reference = new EntityReference(reference.getBackingEntity());
        this.#editorList = new EditorList(this.#reference, this);

        this.addButton(I18N.get('global.accept', 'Accept'), () => {
            this.doUpdateEntity();
            if (!this.isPopout()) this.close();
        });
        this.addButton(I18N.get('global.cancel', 'Cancel'), () => {
            this.close();
        });

        this.init();
        this.reloadValues();
        this.center();

        // listen to entity updates and reload window on changes
        this.#reference.addListener(this);
    }

    init() {
        const container = this.content;
        container.classList.add('flexcol', 'flexnowrap');
        container.style.overflow = 'auto';

        for (const [name, def] of Object.entries(this.#reference.getDefinition().properties)) {
            const editor = createPropertyEditor(def.type, name, name);
            container.appendChild(editor.container);
            this.#editorList.registerEditor(editor, true); //TODO: should these all be set to true?
        }
        for (const extDef of this.#reference.getActiveExtensions()) {
            for (const [name, def] of Object.entries(extDef.properties)) {
                const editor = createPropertyEditor(def.type, name, name);
                container.appendChild(editor.container);
                this.#editorList.registerEditor(editor, true); //TODO: should these all be set to true?
            }
        }

        this.setDimensions(300, 500);
    }

    getReference() {
        return this.#reference;
    }

    getAccessLevel() {
        return this.#reference.getAccessLevel(ServerData.localProfile);
    }

    reloadValues() {
        const accessLevel = this.getAccessLevel();
        this.#editorList.reload(this.#reference, accessLevel);
    }

    doUpdateEntity() {
        // apply settings
        const accessLevel = this.getAccessLevel();
        this.#editorList.apply(this.#reference, accessLevel);

        // update entity
        this.#reference.performUpdate();
    }

    onClose() {
        super.onClose();
        this.#editorList.onClose();

        // remove entity listener
        this.#reference.removeListener(this);
    }

    // listener methods for EntityReference
    entityChanged(reference) {
        this.reloadValues();
    }

    entityRemoved(reference) {
        this.close();
    }

    // HELPER METHODS
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

    createExtensionPointEditor(property, label, className = '') {
        const extensionPoint = DefinitionUtils.getExtensionPointForProperty(this.getReference().getDefinition(), property);
        var extensions = {};
        for (const key of Object.keys(extensionPoint.extensionDefinitions)) {
            extensions[key] = I18N.get(this.getReference().getType() + '.extension.' + extensionPoint.name + '.' + key + '.name', key);
        }

        const editor = new StringSelectionPropertyEditor(property, label, extensions);
        this.#editorList.registerEditor(editor, false);

        if (className) editor.container.className = className;
        return editor.container;
    }
}
