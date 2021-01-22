import { SidepanelTab } from './sidepanel-tab.js';
import { SearchableIDTree } from '../gui/searchable-id-tree.js';
import { getValueProvider } from '../gui/value-providers.js';
import { CanvasWindowEditEntity } from '../canvas/window/canvas-window-edit-entity.js';
import { CanvasWindowInput } from '../canvas/window/canvas-window-input.js';
import { CanvasWindowConfirm } from '../canvas/window/canvas-window-confirm.js';
import { GuiUtils } from '../util/guiutil.js';
import { ServerData } from '../server-data.js';
import { EntityReference } from '../entity/entity-reference.js';

import { Entity } from '../../common/entity/entity.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';

export class SidepanelTabLists extends SidepanelTab {
    constructor() {
        super('Lists', ServerData.isGM());
        
        this.tab.style.display = 'grid';
        this.tab.style.gridTemplateRows = 'auto max-content max-content';
        
        var treePanel = document.createElement('div');
        treePanel.style.overflow = 'auto';
        this.tab.appendChild(treePanel);
        this.tree = new SearchableIDTree(treePanel, 'sidepanel-tab-lists', getValueProvider('token_list'));
        EntityManagers.get('token_list').addListener(() => this.tree.reload());
        
        var buttonPanel1 = document.createElement('div');
        this.tab.appendChild(buttonPanel1);
        GuiUtils.createButton(buttonPanel1, 'New List', () => this.doNewList());
        GuiUtils.createButton(buttonPanel1, 'Toggle Visibility', () => this.doToggleVisibility());
        GuiUtils.createButton(buttonPanel1, 'Edit List', () => this.doEditList());
        GuiUtils.createButton(buttonPanel1, 'Remove List', () => this.doRemoveList());
    }
    
    doNewList() {
        new CanvasWindowInput('New List', 'Enter List Name:', '', name => {
            if(name) {
                const list = new Entity('token_list');
                list.prop('name').setString(name.replace(' ', '')); //TODO: verify name is valid identifier (just letters and numbers and unique)
                list.prop('displayName').setString(name);
                EntityManagers.get('token_list').add(list);
            }
        });
    }
    
    doToggleVisibility() {
        const id = this.tree.getSelectedValue();
        if(id) {
            const list = EntityManagers.get('token_list').find(id);
            if(list) {
                const reference = new EntityReference(list);
                reference.prop('display').setBoolean(!reference.prop('display').getBoolean());
                reference.performUpdate();
            }
        }
    }
    
    doEditList() {
        const id = this.tree.getSelectedValue();
        if(id) {
            const list = EntityManagers.get('token_list').find(id);
            if(list) new CanvasWindowEditEntity(new EntityReference(list));
        }
    }
    
    doRemoveList() {
        const id = this.tree.getSelectedValue();
        if(id) {
            new CanvasWindowConfirm('Confirm removal', 'Are you sure you want to remove the list: '+EntityManagers.get('token_list').find(id).getName()+'?', () => {
                EntityManagers.get('token_list').remove(id);
            });
        }
    }
}
