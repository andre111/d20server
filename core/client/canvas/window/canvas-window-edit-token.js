import { CanvasWindowEditCustom } from './canvas-window-edit-custom.js';
import { ActorPropertyEditor } from '../../gui/property-editor/special/actor-property-editor.js';
import { ImagePropertyEditor } from '../../gui/property-editor/special/image-property-editor.js';
import { Tabs } from '../../gui/tabs.js';
import { MultiLineStringPropertyEditor } from '../../gui/property-editor/special/multi-line-property-editor.js';
import { Events } from '../../../common/events.js';

export class CanvasWindowEditToken extends CanvasWindowEditCustom {

    constructor(w, reference) {
        super(w, reference);
        const container = w.content;
        container.className = 'edit-window-container edit-token-container flexcol';
        
        // build content
        // Header
        const header = document.createElement('div');
        header.className = 'edit-window-header flexrow';
        container.appendChild(header);
        {
            const imageEditor = new ImagePropertyEditor('imagePath');
            imageEditor.getContainer().className = 'edit-token-image';
            header.appendChild(imageEditor.getContainer());
            this.registerEditor(imageEditor);
            
            const headerSide = document.createElement('div');
            headerSide.className = 'cs-header-side flexrow';

            const actorEditor = new ActorPropertyEditor(reference);
            actorEditor.getContainer().className = 'edit-token-actor flexrow';
            headerSide.appendChild(actorEditor.getContainer());
            this.registerEditor(actorEditor, true);
            
            const headerRow1 = document.createElement('ul');
            headerRow1.className = 'edit-window-header-row flexrow';
            const posLI = document.createElement('li');
            posLI.appendChild(document.createTextNode('Position: '));
            posLI.appendChild(this.createLongEditor('x'));
            posLI.appendChild(document.createTextNode(' x '));
            posLI.appendChild(this.createLongEditor('y'));
            headerRow1.appendChild(posLI);
            const sizeLI = document.createElement('li');
            sizeLI.appendChild(document.createTextNode('Size: '));
            sizeLI.appendChild(this.createLongEditor('width'));
            sizeLI.appendChild(document.createTextNode(' x '));
            sizeLI.appendChild(this.createLongEditor('height'));
            headerRow1.appendChild(sizeLI);
            headerSide.appendChild(headerRow1);
            
            const headerRow2 = document.createElement('ul');
            headerRow2.className = 'edit-window-header-row flexrow';
            const rotationLI = document.createElement('li');
            rotationLI.appendChild(document.createTextNode('Rotation: '));
            rotationLI.appendChild(this.createDoubleEditor('rotation'));
            headerRow2.appendChild(rotationLI);
            const layerLI = document.createElement('li');
            layerLI.appendChild(document.createTextNode('Layer: '));
            layerLI.appendChild(this.createLayerEditor('layer'));
            layerLI.appendChild(this.createLongEditor('depth'));
            headerRow2.appendChild(layerLI);
            headerSide.appendChild(headerRow2);
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
            tab.name = 'Gui';
            tab.className = 'edit-window-area edit-window-full-area';
            tabs.appendChild(tab);

            tab.appendChild(this.createBarSettingsEditor(1));
            tab.appendChild(this.createBarSettingsEditor(2));
            tab.appendChild(this.createBarSettingsEditor(3));

            const editBoxesValue = this.createValueContainer('Quick Edit Boxes');
            editBoxesValue.appendChild(this.createStringEditor('editBoxes', '', '', 'edit-token-edit-boxes'));
            editBoxesValue.appendChild(document.createTextNode('(list of [property]:[label],...)'));
            tab.appendChild(editBoxesValue);
        }
        //    GM-Notes
        {
            const tab = document.createElement('div');
            tab.name = 'GM-Notes';
            tab.style.height = '100%';
            tabs.appendChild(tab);
            
            const editor = new MultiLineStringPropertyEditor('gmNotes', '');
            editor.getContainer().style.width = 'calc(100% - 10px)';
            editor.getContainer().style.height = 'calc(100% - 10px)';
            editor.getContainer().style.margin = '5px';
            tab.appendChild(editor.getContainer());
            this.registerEditor(editor);
        }
        //    Light
        {
            const tab = document.createElement('div');
            tab.name = 'Light';
            tab.className = 'edit-window-area edit-window-full-area edit-window-grid';
            tabs.appendChild(tab);

            tab.appendChild(document.createTextNode('Radius Bright (in cells):'));
            tab.appendChild(this.createDoubleEditor('lightBright'));
            tab.appendChild(document.createTextNode('Radius Dim (in cells):'));
            tab.appendChild(this.createDoubleEditor('lightDim'));
            tab.appendChild(document.createTextNode('Angle:'));
            tab.appendChild(this.createLongEditor('lightAngle'));
            tab.appendChild(document.createTextNode('Flickering:'));
            tab.appendChild(this.createBooleanEditor('lightFlicker'));
            tab.appendChild(document.createTextNode('Color:'));
            tab.appendChild(this.createColorEditor('lightColor'));
        } 
        //TODO: replace with something a little less hacky
        Events.trigger('editTokenWindowCreateTabs', { w: this, tabs: tabs, reference: reference });

        Tabs.init(tabs);
        w.setDimensions(420+2, 400+35);
    }

    createBarSettingsEditor(number) {
        const barValue = this.createValueContainer('Bar '+number);
        const span = document.createElement('span');
        span.className = 'edit-window-row flexrow';
        span.appendChild(document.createTextNode('Value:'));
        span.appendChild(this.createStringEditor('bar'+number+'Current'));
        span.appendChild(document.createTextNode('Maximum:'));
        span.appendChild(this.createStringEditor('bar'+number+'Max'));
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
