import { CanvasWindow } from '../canvas-window.js';
import { CanvasWindowEditEntityTab } from './canvas-window-edit-entity-tab.js';
import { Tabs } from '../../gui/tabs.js';
import { ServerData } from '../../server-data.js';

import { Access } from '../../../common/constants.js';
import { EntityReference } from '../../../common/entity/entity-reference.js';
import { Events } from '../../../common/events.js';
import { I18N } from '../../../common/util/i18n.js';

export class CanvasWindowEditEntity extends CanvasWindow {
    constructor(reference) {
        super('Edit '+reference.getDefinition().displayName, true);
        
        this.reference = new EntityReference(reference.getBackingEntity());
        this.tabs = [];
        
        this.addButton(I18N.get('global.ok', 'Ok'), () => {
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
        this.tabs = [];

        const event = Events.trigger('editWindowCreateTabs', { window: this, reference: this.reference }, true);

        // build default data driven tab layout
        if(!event.canceled) {
            // create container
            const container = this.content;
            container.style.paddingTop = '5px';
            
            // create tabs
            const accessLevel = this.getAccessLevel();
            for(const tabDefinition of this.reference.getDefinition().editorTabs) {
                if(Access.matches(tabDefinition.access, accessLevel)) {
                    this.tabs.push(new CanvasWindowEditEntityTab(this, container, tabDefinition));
                }
            }
            for(const extDef of this.reference.getActiveExtensions()) {
                for(const tabDefinition of extDef.editorTabs) {
                    if(Access.matches(tabDefinition.access, accessLevel)) {
                        this.tabs.push(new CanvasWindowEditEntityTab(this, container, tabDefinition));
                    }
                }
            }
            
            if(this.tabs.length > 1) Tabs.init(container);
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
