import { Menu } from '../../gui/menu.js';
import { CanvasWindowEditEntity } from '../window/canvas-window-edit-entity.js';
import { ServerData } from '../../server-data.js';

import { EntityManagers } from '../../../common/entity/entity-managers.js';

export class WallMenu extends Menu{
    constructor(mode, reference, isGM, x, y) {
        super(x, y);

        // only allow gm access to walls
        if(isGM) {
            this.mode = mode;
            this.reference = reference;
            
            var accessLevel = reference.getAccessLevel(ServerData.localProfile);
            
            // create html elements
            this.createItem(this.container, 'Edit', () => this.doEdit());
            
            if(this.reference.prop('door').getBoolean()) {
                if(this.reference.prop('open').getBoolean()) this.createItem(this.container, 'Close Door', () => this.doOpen(false));
                else this.createItem(this.container, 'Open Door', () => this.doOpen(true));
                
                if(this.reference.prop('locked').getBoolean()) this.createItem(this.container, 'Unlock Door', () => this.doLock(false));
                else this.createItem(this.container, 'Lock Door', () => this.doLock(true));
            }
            
            this.createItem(this.container, 'Delete', () => this.doDelete());
            
            this.open();
        }
    }
    
    doEdit() {
        new CanvasWindowEditEntity(this.reference);
    }
    
    doOpen(open) {
        this.reference.prop('open').setBoolean(open);
        this.reference.performUpdate();
    }
    
    doLock(lock) {
        this.reference.prop('locked').setBoolean(lock);
        this.reference.performUpdate();
    }
    
    doDelete() {
        EntityManagers.get('wall').remove(this.reference.id);
    }
}
