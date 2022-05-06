// @ts-check
import { CanvasWindowEditEntity } from '../../../core/client/canvas/window/canvas-window-edit-entity.js';
import { HTMLStringPropertyEditor } from '../../../core/client/gui/property-editor/special/html-string-property-editor.js';
import { ImagePropertyEditor } from '../../../core/client/gui/property-editor/special/image-property-editor.js';
import { MultiLineStringPropertyEditor } from '../../../core/client/gui/property-editor/special/multi-line-property-editor.js';
import { StringCodePropertyEditor } from '../../../core/client/gui/property-editor/special/string-code-property-editor.js';
import { StringPropertyEditor } from '../../../core/client/gui/property-editor/string-property-editor.js';
import { Tabs } from '../../../core/client/gui/tabs.js';
import { I18N } from '../../../core/common/util/i18n.js';

export class CanvasWindowEditSpell extends CanvasWindowEditEntity {
    constructor(parent, reference) {
        super(parent, reference);
    }

    init() {
        const container = this.content;
        container.className = 'edit-window-container edit-spell-container flexcol';

        // build content
        // Header
        const header = document.createElement('div');
        header.className = 'edit-window-header flexrow';
        container.appendChild(header);
        {
            const imageEditor = new ImagePropertyEditor('imagePath');
            imageEditor.container.className = 'edit-attachment-image';
            header.appendChild(imageEditor.container);
            this.registerEditor(imageEditor);

            const headerSide = document.createElement('div');
            headerSide.className = 'cs-header-side flexrow';

            const headerRow1 = document.createElement('ul');
            headerRow1.className = 'edit-window-header-row flexrow';
            const nameLI = document.createElement('li');
            nameLI.appendChild(document.createTextNode(I18N.get('attachment.edit.name', 'Name: ')));
            nameLI.appendChild(this.createStringEditor('name'));
            headerRow1.appendChild(nameLI);
            const pathLI = document.createElement('li');
            pathLI.appendChild(document.createTextNode(I18N.get('attachment.edit.path', 'Path: ')));
            pathLI.appendChild(this.createStringEditor('path'));
            headerRow1.appendChild(pathLI);
            const typeLI = document.createElement('li');
            typeLI.appendChild(document.createTextNode(I18N.get('attachment.edit.type', 'Type: ')));
            typeLI.appendChild(this.createExtensionPointEditor('type'));
            headerRow1.appendChild(typeLI);
            headerSide.appendChild(headerRow1);

            const headerRow2 = document.createElement('ul');
            headerRow2.className = 'edit-window-header-row flexrow';
            const shortDescEditor = new MultiLineStringPropertyEditor('descShort');
            headerRow2.appendChild(shortDescEditor.container);
            this.registerEditor(shortDescEditor, true);
            headerSide.appendChild(headerRow2);

            header.appendChild(headerSide);
        }

        // Content
        const tabs = document.createElement('div');
        tabs.className = 'edit-window-tabs';
        tabs.style.height = '293px'; //TODO: why is this needed, shouldn't the flexcol just make it fit?
        container.appendChild(tabs);
        //    Description
        {
            const tab = document.createElement('div');
            tab.dataset.name = I18N.get('attachment.edit.tabs.description', 'Description');
            tab.className = 'edit-window-area edit-window-full-area edit-spell-content';
            tabs.appendChild(tab);

            const row1 = document.createElement('div');
            row1.className = 'edit-spell-row flexrow';
            row1.appendChild(document.createTextNode(I18N.get('pf.spell.school', 'School') + ': '));
            row1.appendChild(this.createStringEditor('pf_school'));
            row1.appendChild(document.createTextNode(I18N.get('pf.spell.level', 'Level') + ': '));
            row1.appendChild(this.createStringEditor('pf_level'));
            tab.append(row1);

            tab.append(this.createHidingRow(['pf_castingTime'], [I18N.get('pf.spell.castingTime', 'Casting Time') + ': ']));
            tab.append(this.createHidingRow(['pf_components'], [I18N.get('pf.spell.components', 'Components') + ': ']));
            tab.append(this.createHidingRow(['pf_range'], [I18N.get('pf.spell.range', 'Range') + ': ']));

            tab.append(this.createHidingRow(['pf_target'], [I18N.get('pf.spell.target', 'Target') + ': ']));
            tab.append(this.createHidingRow(['pf_effect'], [I18N.get('pf.spell.effect', 'Effect') + ': ']));
            tab.append(this.createHidingRow(['pf_area'], [I18N.get('pf.spell.area', 'Area') + ': ']));
            tab.append(this.createHidingRow(['pf_duration'], [I18N.get('pf.spell.duration', 'Duration') + ': ']));
            tab.append(this.createHidingRow(['pf_save', 'pf_sr'], [I18N.get('pf.spell.save', 'Save') + ': ', I18N.get('pf.spell.sr', 'Spell Resistance') + ': ']));

            const editor = new HTMLStringPropertyEditor('descFull', '');
            editor.container.style.width = 'calc(100% - 10px)';
            editor.container.style.margin = '5px';
            editor.container.style.flexGrow = '1';
            tab.appendChild(editor.container);
            this.registerEditor(editor);
        }
        //    Macro
        {
            const tab = document.createElement('div');
            tab.dataset.name = I18N.get('attachment.edit.tabs.macro', 'Macro');
            tab.className = 'edit-window-area edit-window-full-area';
            tabs.appendChild(tab);

            const editor = new StringCodePropertyEditor('macro', '');
            editor.container.style.width = 'calc(100% - 10px)';
            editor.container.style.height = 'calc(100% - 10px)';
            editor.container.style.margin = '5px';
            tab.appendChild(editor.container);
            this.registerEditor(editor);
        }
        //    Tags
        {
            const tab = document.createElement('div');
            tab.dataset.name = I18N.get('attachment.edit.tabs.tags', 'Tags');
            tab.className = 'edit-window-area edit-window-full-area';
            tabs.appendChild(tab);

            const editor = new MultiLineStringPropertyEditor('tags');
            editor.container.style.width = 'calc(100% - 10px)';
            editor.container.style.height = 'calc(100% - 10px)';
            editor.container.style.margin = '5px';
            tab.appendChild(editor.container);
            this.registerEditor(editor);
        }

        Tabs.init(tabs);
        this.setDimensions(800 + 2, 600 + 35);
    }

    createHidingRow(properties, labels) {
        // create row with editors
        const editors = [];
        const row = document.createElement('div');
        row.className = 'edit-spell-row flexrow';
        for (var i = 0; i < properties.length; i++) {
            const editor = new StringPropertyEditor(properties[i], '', '');
            this.registerEditor(editor);
            editors.push(editor);

            row.appendChild(document.createTextNode(labels[i]));
            row.appendChild(editor.container);
        }

        // create listener for hiding and register to all editors
        const listener = () => this.updateHidingRow(row, editors);
        for (const editor of editors) {
            editor.addChangeListener(listener);
            editor.addReloadListener(listener);
        }

        return row;
    }

    updateHidingRow(row, editors) {
        var hide = true;
        for (const editor of editors) {
            if (editor.textField.value) hide = false;
        }
        if (hide) row.classList.add('hide');
        else row.classList.remove('hide');
    }
}
