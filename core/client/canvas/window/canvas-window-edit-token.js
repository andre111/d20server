// @ts-check
import { CanvasWindowEditEntity } from './canvas-window-edit-entity.js';
import { ActorPropertyEditor } from '../../gui/property-editor/special/actor-property-editor.js';
import { ImagePropertyEditor } from '../../gui/property-editor/special/image-property-editor.js';
import { Tabs } from '../../gui/tabs.js';
import { MultiLineStringPropertyEditor } from '../../gui/property-editor/special/multi-line-property-editor.js';
import { Events } from '../../../common/events.js';
import { I18N } from '../../../common/util/i18n.js';
import { ServerData } from '../../server-data.js';

export class CanvasWindowEditToken extends CanvasWindowEditEntity {
    constructor(parent, reference) {
        super(parent, reference);
    }

    init() {
        const container = this.content;
        container.className = 'edit-window-container edit-token-container flexcol';

        // build content
        // Header
        const header = document.createElement('div');
        header.className = 'edit-window-header flexrow';
        container.appendChild(header);
        {
            const imageEditor = new ImagePropertyEditor('imagePath');
            imageEditor.container.className = 'edit-token-image';
            header.appendChild(imageEditor.container);
            this.registerEditor(imageEditor);

            const headerSide = document.createElement('div');
            headerSide.className = 'edit-window-header-side flexrow';

            const actorEditor = new ActorPropertyEditor(this.getReference());
            actorEditor.container.className = 'edit-token-actor flexrow';
            headerSide.appendChild(actorEditor.container);
            this.registerEditor(actorEditor, true);

            const headerRow1 = document.createElement('ul');
            headerRow1.className = 'edit-window-header-row flexrow';
            const posLI = document.createElement('li');
            posLI.appendChild(document.createTextNode(I18N.get('token.edit.position', 'Position: ')));
            posLI.appendChild(this.createLongEditor('x'));
            posLI.appendChild(document.createTextNode(' x '));
            posLI.appendChild(this.createLongEditor('y'));
            headerRow1.appendChild(posLI);
            const rotationLI = document.createElement('li');
            rotationLI.appendChild(document.createTextNode(I18N.get('token.edit.rotation', 'Rotation: ')));
            rotationLI.appendChild(this.createDoubleEditor('rotation'));
            headerRow1.appendChild(rotationLI);
            headerSide.appendChild(headerRow1);

            const headerRow2 = document.createElement('ul');
            headerRow2.className = 'edit-window-header-row flexrow';
            const sizeLI = document.createElement('li');
            sizeLI.appendChild(document.createTextNode(I18N.get('token.edit.size', 'Size: ')));
            sizeLI.appendChild(this.createLongEditor('width'));
            sizeLI.appendChild(document.createTextNode(' x '));
            sizeLI.appendChild(this.createLongEditor('height'));
            headerRow2.appendChild(sizeLI);
            const scrollLi = document.createElement('li');
            scrollLi.appendChild(document.createTextNode(I18N.get('token.edit.scroll', 'Scroll: ')));
            scrollLi.appendChild(this.createLongEditor('scrollX'));
            scrollLi.appendChild(document.createTextNode(' x '));
            scrollLi.appendChild(this.createLongEditor('scrollY'));
            headerRow2.appendChild(scrollLi);
            headerSide.appendChild(headerRow2);

            const headerRow3 = document.createElement('ul');
            headerRow3.className = 'edit-window-header-row flexrow';
            const layerLI = document.createElement('li');
            layerLI.appendChild(document.createTextNode(I18N.get('token.edit.layer', 'Layer: ')));
            layerLI.appendChild(this.createLayerEditor('layer'));
            layerLI.appendChild(this.createLongEditor('depth'));
            headerRow3.appendChild(layerLI);
            headerSide.appendChild(headerRow3);
            header.appendChild(headerSide);
        }

        // Content
        const tabs = document.createElement('div');
        tabs.className = 'edit-window-tabs';
        tabs.style.height = '293px'; //TODO: why is this needed, shouldn't the flexcol just make it fit?
        container.appendChild(tabs);
        //    Gui
        {
            const tab = document.createElement('div');
            tab.dataset.name = I18N.get('token.edit.tabs.gui', 'Gui');
            tab.className = 'edit-window-area edit-window-full-area';
            tabs.appendChild(tab);

            tab.appendChild(this.createBarSettingsEditor(1));
            tab.appendChild(this.createBarSettingsEditor(2));
            tab.appendChild(this.createBarSettingsEditor(3));

            const editBoxesValue = this.createValueContainer(I18N.get('token.edit.gui.editboxes.title', 'Quick Edit Boxes'));
            editBoxesValue.appendChild(this.createStringEditor('editBoxes', '', '', 'edit-token-edit-boxes'));
            editBoxesValue.appendChild(document.createTextNode(I18N.get('token.edit.gui.editboxes.explanation', '(list of [property]:[label],...)')));
            tab.appendChild(editBoxesValue);
        }
        //    GM-Notes
        if (ServerData.isGM()) {
            const tab = document.createElement('div');
            tab.dataset.name = I18N.get('token.edit.tabs.gmnotes', 'GM-Notes');
            tab.className = 'edit-window-area edit-window-full-area';
            tabs.appendChild(tab);

            const editor = new MultiLineStringPropertyEditor('gmNotes', '');
            editor.container.style.width = 'calc(100% - 10px)';
            editor.container.style.height = 'calc(100% - 10px)';
            editor.container.style.margin = '5px';
            tab.appendChild(editor.container);
            this.registerEditor(editor);
        }
        //    Light
        {
            const tab = document.createElement('div');
            tab.dataset.name = I18N.get('token.edit.tabs.light', 'Light');
            tab.className = 'edit-window-area edit-window-full-area edit-window-grid';
            tabs.appendChild(tab);

            tab.appendChild(document.createTextNode(I18N.get('token.edit.light.bright', 'Bright Light Radius (in cells):')));
            tab.appendChild(this.createDoubleEditor('lightBright'));
            tab.appendChild(document.createTextNode(I18N.get('token.edit.light.dim', 'Dim Light Radius (in cells):')));
            tab.appendChild(this.createDoubleEditor('lightDim'));
            tab.appendChild(document.createTextNode(I18N.get('token.edit.light.dark', 'Darkness Radius (in cells):')));
            tab.appendChild(this.createDoubleEditor('lightDark'));
            tab.appendChild(document.createTextNode(I18N.get('token.edit.light.angle', 'Angle:')));
            tab.appendChild(this.createLongEditor('lightAngle'));
            tab.appendChild(document.createTextNode(I18N.get('token.edit.light.flicker', 'Flickering:')));
            tab.appendChild(this.createBooleanEditor('lightFlicker'));
            tab.appendChild(document.createTextNode(I18N.get('token.edit.light.color', 'Colour:')));
            tab.appendChild(this.createColorEditor('lightColor'));
        }
        //TODO: replace with something a little less hacky
        Events.trigger('editTokenWindowCreateTabs', { w: this, tabs: tabs, reference: this.getReference() });

        Tabs.init(tabs);
        this.setDimensions(420 + 2, 430 + 35);
    }

    createBarSettingsEditor(number) {
        const barValue = this.createValueContainer(I18N.get('token.edit.gui.bars.' + number, 'Bar ' + number));
        const span = document.createElement('span');
        span.className = 'edit-window-row flexrow';
        span.appendChild(document.createTextNode(I18N.get('token.edit.gui.bars.value', 'Value:')));
        span.appendChild(this.createStringEditor('bar' + number + 'Current'));
        span.appendChild(document.createTextNode(I18N.get('token.edit.gui.bars.max', 'Maximum:')));
        span.appendChild(this.createStringEditor('bar' + number + 'Max'));
        barValue.appendChild(span);
        return barValue;
    }

    createCustomLabeledEditor(label, editor) {
        const span = document.createElement('span');
        span.className = 'edit-window-row flexrow';
        span.appendChild(document.createTextNode(label));
        span.appendChild(editor);
        return span;
    }
}
