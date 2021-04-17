import { SidepanelTab } from './sidepanel-tab.js';
import { SearchableIDTree } from '../gui/searchable-id-tree.js';
import { getValueProvider } from '../gui/value-providers.js';
import { CanvasWindowEditEntity } from '../canvas/window/canvas-window-edit-entity.js';
import { CanvasWindowInput } from '../canvas/window/canvas-window-input.js';
import { GuiUtils } from '../util/guiutil.js';
import { ServerData } from '../server-data.js';

import { Entity } from '../../common/entity/entity.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { EntityReference } from '../../common/entity/entity-reference.js';
import { EntityMenu } from '../canvas/mode/entity-menu.js';

export class SidepanelTabAttachments extends SidepanelTab {
    constructor() {
        super('Attachments', true);
        
        this.tab.style.display = 'grid';
        this.tab.style.gridTemplateRows = 'auto max-content max-content';
        
        const treePanel = document.createElement('div');
        treePanel.style.overflow = 'auto';
        this.tab.appendChild(treePanel);
        this.tree = new SearchableIDTree(treePanel, 'sidepanel-tab-attachments', getValueProvider('attachment'), () => this.doOpen(), (id, x, y) => this.doOpenMenu(x, y));
        EntityManagers.get('attachment').addListener(() => this.tree.reload());
        
        if(ServerData.isGM()) {
            const buttonPanel = document.createElement('div');
            this.tab.appendChild(buttonPanel);
            GuiUtils.createButton(buttonPanel, 'New Attachment', () => this.doAdd()).className = 'sidepanel-button';
        }
    }
    
    doOpen() {
        const attachment = EntityManagers.get('attachment').find(this.tree.getSelectedValue());
        if(attachment) new CanvasWindowEditEntity(new EntityReference(attachment));
    }

    doOpenMenu(x, y) {
        const attachment = EntityManagers.get('attachment').find(this.tree.getSelectedValue());
        if(attachment) new EntityMenu(null, new EntityReference(attachment), ServerData.isGM(), x, y);
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
}
