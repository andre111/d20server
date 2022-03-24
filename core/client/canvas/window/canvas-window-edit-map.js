// @ts-check
import { CanvasWindowEditEntity } from './canvas-window-edit-entity.js';
import { Events } from '../../../common/events.js';
import { I18N } from '../../../common/util/i18n.js';

export class CanvasWindowEditMap extends CanvasWindowEditEntity {
    constructor(parent, reference) {
        super(parent, reference);
    }

    init() {
        const container = this.content;
        container.className = 'edit-window-container edit-map-container flexcol';

        // build content
        // Header
        const header = document.createElement('div');
        header.className = 'edit-window-header flexrow';
        container.appendChild(header);
        {
            const headerRow1 = document.createElement('ul');
            headerRow1.className = 'edit-window-header-row flexrow';
            const nameLI = document.createElement('li');
            nameLI.appendChild(document.createTextNode(I18N.get('map.edit.name', 'Name: ')));
            nameLI.appendChild(this.createStringEditor('name'));
            headerRow1.appendChild(nameLI);
            header.appendChild(headerRow1);

            const headerRow2 = document.createElement('ul');
            headerRow2.className = 'edit-window-header-row flexrow';
            const posLI = document.createElement('li');
            posLI.appendChild(document.createTextNode(I18N.get('map.edit.size', 'Grid Size: ')));
            posLI.appendChild(this.createLongEditor('gridSize'));
            headerRow2.appendChild(posLI);
            const sizeLI = document.createElement('li');
            sizeLI.appendChild(document.createTextNode(I18N.get('map.edit.dimensions', 'Dimensions: ')));
            sizeLI.appendChild(this.createLongEditor('width'));
            sizeLI.appendChild(document.createTextNode(' x '));
            sizeLI.appendChild(this.createLongEditor('height'));
            headerRow2.appendChild(sizeLI);
            header.appendChild(headerRow2);
        }

        // Content
        const content = document.createElement('div');
        content.className = 'edit-window-area edit-window-full-area edit-window-grid';
        content.style.height = '193px'; //TODO: why is this needed, shouldn't the flexcol just make it fit?
        container.appendChild(content);

        content.appendChild(document.createTextNode(I18N.get('map.edit.light', 'Light:')));
        content.appendChild(this.createLightEditor('light'));
        content.appendChild(document.createTextNode(I18N.get('map.edit.effect', 'Effect:')));
        content.appendChild(this.createEffectEditor('effect'));
        content.appendChild(document.createTextNode(I18N.get('map.edit.playersCanEnter', 'Free Access:')));
        content.appendChild(this.createBooleanEditor('playersCanEnter'));

        //TODO: replace with something a little less hacky
        Events.trigger('editMapWindowCreateContent', { w: this, content: content, reference: this.getReference() });

        this.setDimensions(350 + 2, 300 + 35);
    }
}
