import { CanvasWindowList } from './canvas-window-list.js';
import { ServerData } from '../../server-data.js';
import { Access } from '../../../common/constants.js';
import { EntityManagers } from '../../../common/entity/entity-managers.js';

export class CanvasWindowListManager {
    constructor() {
        this.windows = new Map();
        
        EntityManagers.get('token_list').addListener(() => this.update());
        this.update();
    }
    
    //TODO...
    update() {
        // remove windows no longer needed
        var toRemove = [];
        for(const [id, w] of this.windows) {
            var list = EntityManagers.get('token_list').find(id);
            if(!this.shouldShow(list)) {
                w.close();
                toRemove.push(id);
            }
        }
        for(var removedID of toRemove) {
            this.windows.delete(removedID);
        }
        
        // add missing windows
        for(var list of EntityManagers.get('token_list').all()) {
            if(!this.windows.has(list.id) && this.shouldShow(list)) {
                this.windows.set(list.id, new CanvasWindowList(list));
            }
        }
        
        // update all
        for(const [id, w] of this.windows) {
            var list = EntityManagers.get('token_list').find(id);
            w.updateList(list, this.shouldShow(list));
        }
    }
    
    shouldShow(list) {
        if(list == null || list == undefined) return false;
        if(list.prop('tokens').getLongList().length == 0) return false;
        if(list.getViewAccess() == Access.GM && !ServerData.isGM()) return false;
        if(!list.prop('display').getBoolean()) return false;
        
        return true;
    }
}
