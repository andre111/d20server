// @ts-check
import { CanvasWindowEditEntity } from './canvas-window-edit-entity.js';
import { ImagePropertyEditor } from '../../gui/property-editor/special/image-property-editor.js';
import { MultiLineStringPropertyEditor } from '../../gui/property-editor/special/multi-line-property-editor.js';
import { HTMLStringPropertyEditor } from '../../gui/property-editor/special/html-string-property-editor.js';
import { I18N } from '../../../common/util/i18n.js';

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
            headerSide.appendChild(headerRow1);

            const headerRow2 = document.createElement('ul');
            headerRow2.className = 'edit-window-header-row flexrow';
            const shortDescEditor = new MultiLineStringPropertyEditor('descShort');
            headerRow2.appendChild(shortDescEditor.container);
            this.registerEditor(shortDescEditor, true);
            headerSide.appendChild(headerRow2);

            header.appendChild(headerSide);
        }

        const content = document.createElement('div');
        content.className = 'edit-window-area edit-attachment-content';
        container.appendChild(content);
        {
            const editor = new HTMLStringPropertyEditor('descFull', '');
            editor.container.style.width = 'calc(100% - 10px)';
            editor.container.style.height = 'calc(100% - 10px)';
            editor.container.style.margin = '5px';
            content.appendChild(editor.container);
            this.registerEditor(editor);
        }

        this.setDimensions(800 + 2, 400 + 35);
    }
}
