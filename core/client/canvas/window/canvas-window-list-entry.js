import { ServerData } from '../../server-data.js';
import { MessageService } from '../../service/message-service.js';

import { EntityManagers } from '../../../common/entity/entity-managers.js';
import { TokenListUtils } from '../../../common/util/token-list-util.js';
import { TokenListValue } from '../../../common/messages.js';
import { Client } from '../../app.js';

export class CanvasWindowListEntry {
    constructor(parent, list, tokenID, value, current, editable) {
        this.list = list;
        this.tokenID = tokenID;
        this.value = value;
        
        // create html elements
        var container = document.createElement('div');
        container.className = 'list-window-entry';
        if(current) container.className = 'list-window-entry-active';
        parent.appendChild(container);
        
        var leftPanel = document.createElement('div');
        leftPanel.style.flexGrow = '1';
        leftPanel.style.display = 'flex';
        leftPanel.style.alignItems = 'center';
        container.appendChild(leftPanel);
        
        var rightPanel = document.createElement('div');
        rightPanel.style.display = 'inline-block';
        container.appendChild(rightPanel);
        
        //
        var token = EntityManagers.get('token').find(tokenID);
        if(token) {
            // add image
            var img = new Image();
            if(token.prop('imagePath').getString() != '') img.src = '/data/files'+token.prop('imagePath').getString();
            img.style.width = '40px';
            img.style.height = '40px';
            img.style.objectFit = 'contain';
            leftPanel.appendChild(img);
            
            // add name
            var accessLevel = token.getAccessLevel(ServerData.localProfile);
            var nameProp = token.prop('name');
            if(nameProp.canView(accessLevel)) {
                leftPanel.appendChild(document.createTextNode(nameProp.getString()));
            }
        }
        
        // add remove button
        var remove = document.createElement('button');
        remove.innerHTML = 'X';
        remove.disabled = !editable;
        remove.onclick = () => this.onRemove();
        rightPanel.appendChild(remove);
        
        // add value field
        this.valueField = document.createElement('input');
        this.valueField.type = 'text';
        this.valueField.value = value;
        this.valueField.disabled = !editable;
        this.valueField.style.width = '60px';
        this.valueField.style.height = '40px';
        this.valueField.onchange = () => this.onConfirmChange();
        rightPanel.appendChild(this.valueField);
        
        // add hover functionality
        container.onmouseover = () => Client.getState().setHighlightToken(tokenID);
        container.onmouseout = () => Client.getState().releaseHighlightToken(tokenID);
    }
    
    onRemove() {
        var token = EntityManagers.get('token').find(this.tokenID);
        if(token) {
            const msg = new TokenListValue(this.list, this.tokenID, 0, false, true);
            MessageService.send(msg);
        }
    }
    
    onConfirmChange() {
        var newValue = Number(this.valueField.value);
        if(!Number.isNaN(newValue)) {
            var token = EntityManagers.get('token').find(this.tokenID);
            if(token) {
                const msg = new TokenListValue(this.list, this.tokenID, newValue, TokenListUtils.isHidden(this.list, this.tokenID), false);
                MessageService.send(msg);
            }
        }
    }
}
