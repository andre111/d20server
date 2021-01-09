import { CanvasWindowEditEntity } from '../window/canvas-window-edit-entity.js';
import { ServerData } from '../../server-data.js';

import { EntityManagers } from '../../../common/entity/entity-managers.js';

export class WallMenu {
    constructor(mode, reference, isGM, x, y) {
        // only allow gm access to walls
        if(isGM) {
            this.mode = mode;
            this.reference = reference;
            this.closed = false;
            
            var accessLevel = reference.getAccessLevel(ServerData.localProfile);
            
            // create html elements
            this.container = document.createElement('ul');
            this.container.style.position = 'fixed';
            this.container.style.width = '150px';
            this.container.style.left = x+'px';
            this.container.style.top = y+'px';
            document.body.appendChild(this.container);
            
            this.createItem(this.container, 'Edit', () => this.doEdit());
            
            if(this.reference.prop('door').getBoolean()) {
                if(this.reference.prop('open').getBoolean()) this.createItem(this.container, 'Close Door', () => this.doOpen(false));
                else this.createItem(this.container, 'Open Door', () => this.doOpen(true));
                
                if(this.reference.prop('locked').getBoolean()) this.createItem(this.container, 'Unlock Door', () => this.doLock(false));
                else this.createItem(this.container, 'Lock Door', () => this.doLock(true));
            }
            
            this.createItem(this.container, 'Delete', () => this.doDelete());
            
            $(this.container).menu({
                select: (event, ui) => {
                    if(event.currentTarget.menucallback != null && event.currentTarget.menucallback != undefined) {
                        event.currentTarget.menucallback();
                        this.close();
                    }
                }
            });
        }
    }
    
    createItem(parent, name, callback) {
        var item = document.createElement('li');
        var div = document.createElement('div');
        div.innerHTML = name;
        item.appendChild(div);
        item.menucallback = callback;
        parent.appendChild(item);
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
        this.mode.activeEntities = [];
    }
    
    close() {
        if(this.closed) return;
        this.closed = true;
        document.body.removeChild(this.container);
    }
}
