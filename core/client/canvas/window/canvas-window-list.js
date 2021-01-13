import { CanvasWindow } from '../canvas-window.js';
import { CanvasWindowListEntry } from './canvas-window-list-entry.js';
import { ServerData } from '../../server-data.js';
import { EntityReference } from '../../entity/entity-reference.js';

import { EntityManagers } from '../../../common/entity/entity-managers.js';
import { TokenListUtils } from '../../../common/util/token-list-util.js';

export class CanvasWindowList extends CanvasWindow {
    constructor(list) {
        super(list.prop('displayName').getString(), false);
        
        this.list = list;
        
        // prevent closing when not GM or update visible state if proceeding
        this.shouldClose = false;
        this.frame.style.margin = '0';
        $(this.frame).on('dialogbeforeclose', (event, ui) => { 
            if(!this.shouldClose && !ServerData.isGM()) return false; 
        });
        $(this.frame).on('dialogclose', (event, ui) => { 
            var reference = new EntityReference(this.list);
            if(reference) {
                reference.prop('display').setBoolean(false);
                reference.performUpdate();
            }
        });
        
        // premake content
        this.buttonPanel = document.createElement('div');
        var previous = document.createElement('button');
        previous.innerHTML = '&lt;-';
        previous.onclick = () => this.doMoveIndex(-1);
        this.buttonPanel.appendChild(previous);
        var next = document.createElement('button');
        next.innerHTML = '-&gt;';
        next.onclick = () => this.doMoveIndex(1);
        this.buttonPanel.appendChild(next);
        
        // store and resize location
        this.storeAndRestoreLocation('token_list_window_'+this.list.id);
    }
    
    updateList(list, shouldShow) {
        this.list = list;
        
        // add entries
        this.frame.innerHTML = '';
        var mainPanel = document.createElement('div');
        mainPanel.style.overflow = 'auto';
        mainPanel.style.margin = '0';
        mainPanel.style.padding = '6px';
        mainPanel.style.width = '100%';
        mainPanel.style.height = '100%';
        this.frame.appendChild(mainPanel);
        
        var i = 0;
        for(var tokenID of list.prop('tokens').getLongList()) {
            var token = EntityManagers.get('token').find(tokenID);
            var editable = token == null || token == undefined || list.canEditWithAccess(TokenListUtils.getAccessLevel(ServerData.localProfile, list, token));
            new CanvasWindowListEntry(mainPanel, list, tokenID, TokenListUtils.getValue(list, tokenID), i==list.prop('currentIndex').getLong(), editable);
            i++;
        }
        
        
        // add buttons
        if(list.canEdit(ServerData.localProfile)) {
            this.frame.appendChild(this.buttonPanel);
        }
    }
    
    close() {
        this.shouldClose = true;
        super.close();
    }
    
    doMoveIndex(offset) {
        var oldIndex = this.list.prop('currentIndex').getLong();
        var index = oldIndex + offset;
        if(index < 0) index = this.list.prop('tokens').getLongList().length-1;
        if(index >= this.list.prop('tokens').getLongList().length) index = 0;
        
        var reference = new EntityReference(this.list);
        reference.prop('currentIndex').setLong(index);
        reference.performUpdate();
    }
}
