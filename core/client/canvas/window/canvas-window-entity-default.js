import { CanvasWindow } from '../canvas-window.js';
import { ServerData } from '../../server-data.js';

import { EntityReference } from '../../../common/entity/entity-reference.js';
import { Events } from '../../../common/events.js';
import { I18N } from '../../../common/util/i18n.js';
import { createPropertyEditor } from '../../gui/property-editors.js';
import { EditorList } from '../../gui/editor-list.js';

export class CanvasWindowEntityDefault extends CanvasWindow {
    constructor(parent, reference) {
        super(parent, 'Edit '+reference.getDefinition().displayName, true);
        
        this.reference = new EntityReference(reference.getBackingEntity());
        this.tabs = [];
        
        this.addButton(I18N.get('global.accept', 'Accept'), () => {
            this.doUpdateEntity();
            if(!this.isPopout()) this.close();
        });
        this.addButton(I18N.get('global.cancel', 'Cancel'), () => {
            this.close();
        });

        this.setDimensions(800, 500);
        
        this.initTabs();
        this.reloadValues();
        this.center();

        // listen to entity updates and reload window on changes
        this.reference.addListener(this);
    }
    
    initTabs() {
        const event = Events.trigger('editWindowCreateTabs', { window: this, reference: this.reference }, true);

        // build fallback property list
        if(!event.canceled) {
            const container = this.content;
            container.classList.add('flexcol', 'flexnowrap');
            container.style.overflow = 'auto';

            const editorList = new EditorList(this.reference, this);
            for(const [name, def] of Object.entries(this.reference.getDefinition().properties)) {
                const editor = createPropertyEditor(def.type, name, name);
                container.appendChild(editor.container);
                editorList.registerEditor(editor, true); //TODO: should these all be set to true?
            }
            for(const extDef of this.reference.getActiveExtensions()) {
                for(const [name, def] of Object.entries(extDef.properties)) {
                    const editor = createPropertyEditor(def.type, name, name);
                    container.appendChild(editor.container);
                    editorList.registerEditor(editor, true); //TODO: should these all be set to true?
                }
            }
            this.tabs.push(editorList);

            this.setDimensions(300, 500);
        }
    }
    
    getReference() {
        return this.reference;
    }
    
    getAccessLevel() {
        return this.reference.getAccessLevel(ServerData.localProfile);
    }
    
    reloadValues() {
        const accessLevel = this.getAccessLevel();
        for(const tab of this.tabs) {
            tab.reload(this.reference, accessLevel);
        }
    }
    
    doUpdateEntity() {
        // apply settings
        const accessLevel = this.getAccessLevel();
        for(const tab of this.tabs) {
            tab.apply(this.reference, accessLevel);
        }
        
        // update entity
        this.reference.performUpdate();
    }
    
    onClose() {
        super.onClose();
        for(const tab of this.tabs) {
            tab.onClose();
        }

        // remove entity listener
        this.reference.removeListener(this);
    }

    // listener methods for EntityReference
    entityChanged(reference) {
        this.reloadValues();
    }

    entityRemoved(reference) {
        this.close();
    }
}
