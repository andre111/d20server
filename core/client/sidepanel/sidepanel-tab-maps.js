import { SidepanelTab } from './sidepanel-tab.js';
import { SearchableIDTree } from '../gui/searchable-id-tree.js';
import { getValueProvider } from '../gui/value-providers.js';
import { CanvasWindowEditEntity } from '../canvas/window/canvas-window-edit-entity.js';
import { CanvasWindowInput } from '../canvas/window/canvas-window-input.js';
import { CanvasWindowConfirm } from '../canvas/window/canvas-window-confirm.js';
import { GuiUtils } from '../util/guiutil.js';
import { ServerData } from '../server-data.js';
import { MessageService } from '../service/message-service.js';

import { Entity } from '../../common/entity/entity.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { EntityReference } from '../../common/entity/entity-reference.js';
import { MovePlayerToMap } from '../../common/messages.js';

export class SidepanelTabMaps extends SidepanelTab {
    constructor() {
        super('Maps', true);
        
        this.tab.style.display = 'grid';
        this.tab.style.gridTemplateRows = 'auto max-content max-content';
        
        var treePanel = document.createElement('div');
        treePanel.style.overflow = 'auto';
        this.tab.appendChild(treePanel);
        this.tree = new SearchableIDTree(treePanel, 'sidepanel-tab-maps', getValueProvider('map'));
        EntityManagers.get('map').addListener(() => this.tree.reload());
        
        var buttonPanel1 = document.createElement('div');
        this.tab.appendChild(buttonPanel1);
        GuiUtils.createButton(buttonPanel1, 'Open Map', () => this.doOpenMap());
        if(ServerData.isGM()) {
            GuiUtils.createButton(buttonPanel1, 'Move Players', () => this.doMovePlayers());
        }
        
        if(ServerData.isGM()) {
            var buttonPanel2 = document.createElement('div');
            this.tab.appendChild(buttonPanel2);
            GuiUtils.createButton(buttonPanel2, 'New Map', () => this.doNewMap());
            GuiUtils.createButton(buttonPanel2, 'Edit Map', () => this.doEditMap());
            GuiUtils.createButton(buttonPanel2, 'Remove Map', () => this.doRemoveMap());
        }
    }
    
    doOpenMap() {
        const id = this.tree.getSelectedValue();
        if(id) {
            const map = EntityManagers.get('map').find(id);
            if(map) {
                const msg = new MovePlayerToMap(map, ServerData.localProfile);
                MessageService.send(msg);
            }
        }
    }
    
    doMovePlayers() {
        const id = this.tree.getSelectedValue();
        if(id) {
            const map = EntityManagers.get('map').find(id);
            if(map) {
                const msg = new MovePlayerToMap(map);
                MessageService.send(msg);
            }
        }
    }
    
    doEditMap() {
        const id = this.tree.getSelectedValue();
        if(id) {
            const map = EntityManagers.get('map').find(id);
            if(map) new CanvasWindowEditEntity(new EntityReference(map));
        }
    }
    
    doNewMap() {
        new CanvasWindowInput('New Map', 'Enter Map Name:', '', name => {
            if(name) {
                const map = new Entity('map');
                map.prop('name').setString(name);
                EntityManagers.get('map').add(map);
            }
        });
    }
    
    doRemoveMap() {
        const id = this.tree.getSelectedValue();
        if(id) {
            new CanvasWindowConfirm('Confirm removal', 'Are you sure you want to remove the map: '+EntityManagers.get('map').find(id).getName()+'?', () => {
                EntityManagers.get('map').remove(id);
            });
        }
    }
}
