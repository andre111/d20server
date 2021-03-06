// @ts-check
import { CanvasWindowEditEntity } from './canvas-window-edit-entity.js';
import { ImagePropertyEditor } from '../../gui/property-editor/special/image-property-editor.js';
import { MultiLineStringPropertyEditor } from '../../gui/property-editor/special/multi-line-property-editor.js';
import { HTMLStringPropertyEditor } from '../../gui/property-editor/special/html-string-property-editor.js';
import { StringCodePropertyEditor } from '../../gui/property-editor/special/string-code-property-editor.js';
import { I18N } from '../../../common/util/i18n.js';
import { Tabs } from '../../gui/tabs.js';

export class CanvasWindowEditAttachment extends CanvasWindowEditEntity {
    constructor(parent, reference) {
        super(parent, reference);
    }

    init() {
        const container = this.content;
        container.className = 'edit-window-container edit-attachment-container flexcol';

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
            tab.className = 'edit-window-area edit-window-full-area';
            tabs.appendChild(tab);

            const editor = new HTMLStringPropertyEditor('descFull', '');
            editor.container.style.width = 'calc(100% - 10px)';
            editor.container.style.height = 'calc(100% - 10px)';
            editor.container.style.margin = '5px';
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
}
