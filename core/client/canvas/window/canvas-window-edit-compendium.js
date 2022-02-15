import { CanvasWindowEditEntity } from './canvas-window-edit-entity.js';
import { HTMLStringPropertyEditor } from '../../gui/property-editor/special/html-string-property-editor.js';
import { I18N } from '../../../common/util/i18n.js';
import { Access } from '../../../common/constants.js';

export class CanvasWindowEditCompendium extends CanvasWindowEditEntity {
    constructor(parent, reference) {
        super(parent, reference);
    }

    init() {
        const container = this.content;
        container.className = 'edit-window-container edit-compendium-container flexcol';

        // build content
        // Header
        const header = document.createElement('div');
        header.className = 'edit-window-header flexrow';
        container.appendChild(header);
        {
            const nameEditor = this.createStringEditor('name');
            nameEditor.className = 'edit-compendium-name';
            header.appendChild(nameEditor);

            const headerSide = document.createElement('div');
            headerSide.className = 'cs-header-side flexrow';

            const headerRow1 = document.createElement('ul');
            headerRow1.className = 'edit-window-header-row flexrow';
            const accessLI = document.createElement('li');
            accessLI.appendChild(document.createTextNode(I18N.get('compendium.edit.access', 'Access: ')));
            accessLI.appendChild(this.createAccessEditor('access', [Access.EVERYONE, Access.GM]));
            headerRow1.appendChild(accessLI);
            headerSide.appendChild(headerRow1);

            const headerRow2 = document.createElement('ul');
            headerRow2.className = 'edit-window-header-row flexrow';
            const pathLI = document.createElement('li');
            pathLI.appendChild(document.createTextNode(I18N.get('compendium.edit.path', 'Path: ')));
            pathLI.appendChild(this.createStringEditor('path'));
            headerRow1.appendChild(pathLI);
            headerSide.appendChild(headerRow2);

            header.appendChild(headerSide);
        }

        const content = document.createElement('div');
        content.className = 'edit-window-area edit-compendium-content';
        container.appendChild(content);
        {
            const editor = new HTMLStringPropertyEditor('content', '');
            editor.container.style.width = 'calc(100% - 10px)';
            editor.container.style.height = 'calc(100% - 10px)';
            editor.container.style.margin = '5px';
            content.appendChild(editor.container);
            this.registerEditor(editor);
        }

        this.setDimensions(700 + 2, 800 + 35);
        this.showPopoutButton(true);
    }
}
