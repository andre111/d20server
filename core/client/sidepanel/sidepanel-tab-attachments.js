import { SidepanelTab } from './sidepanel-tab.js';
import { SearchableIDTree } from '../gui/searchable-id-tree.js';
import { getValueProvider } from '../gui/value-providers.js';
import { CanvasWindowEditEntity } from '../canvas/window/canvas-window-edit-entity.js';
import { CanvasWindowInput } from '../canvas/window/canvas-window-input.js';
import { CanvasWindowConfirm } from '../canvas/window/canvas-window-confirm.js';
import { GuiUtils } from '../util/guiutil.js';
import { ServerData } from '../server-data.js';

import { Entity } from '../../common/entity/entity.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { EntityReference } from '../../common/entity/entity-reference.js';

export class SidepanelTabAttachments extends SidepanelTab {
    constructor() {
        super('Attachments', true);
        
        this.tab.style.display = 'grid';
        this.tab.style.gridTemplateRows = 'auto max-content max-content';
        
        var treePanel = document.createElement('div');
        treePanel.style.overflow = 'auto';
        this.tab.appendChild(treePanel);
        this.tree = new SearchableIDTree(treePanel, 'sidepanel-tab-attachments', getValueProvider('attachment'), () => this.doOpen());
        EntityManagers.get('attachment').addListener(() => this.tree.reload());
        
        var buttonPanel1 = document.createElement('div');
        this.tab.appendChild(buttonPanel1);
        GuiUtils.createButton(buttonPanel1, 'Open', () => this.doOpen());
        if(ServerData.isGM()) {
            GuiUtils.createButton(buttonPanel1, 'Add Attachment', () => this.doAdd());
            GuiUtils.createButton(buttonPanel1, 'Remove Attachment', () => this.doRemove());
        }
    }
    
    doOpen() {
        const id = this.tree.getSelectedValue();
        if(id) {
            const attachment = EntityManagers.get('attachment').find(id);
            if(attachment) new CanvasWindowEditEntity(new EntityReference(attachment));
        }
    }
    
    doAdd() {
        new CanvasWindowInput('New Attachment', 'Enter Attachment Name:', '', name => {
            if(name) {
                const attachment = new Entity('attachment');
                attachment.prop('name').setString(name);
                EntityManagers.get('attachment').add(attachment);
            }
        });
    }
    
    doRemove() {
        const id = this.tree.getSelectedValue();
        if(id) {
            new CanvasWindowConfirm('Confirm removal', 'Are you sure you want to remove the attachment: '+EntityManagers.get('attachment').find(id).getName()+'?', () => {
                EntityManagers.get('attachment').remove(id);
            });
        }
    }
}
