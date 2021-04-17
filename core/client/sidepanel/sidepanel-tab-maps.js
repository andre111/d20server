import { SidepanelTab } from './sidepanel-tab.js';
import { SearchableIDTree } from '../gui/searchable-id-tree.js';
import { getValueProvider } from '../gui/value-providers.js';
import { CanvasWindowInput } from '../canvas/window/canvas-window-input.js';
import { GuiUtils } from '../util/guiutil.js';
import { ServerData } from '../server-data.js';
import { MessageService } from '../service/message-service.js';

import { Entity } from '../../common/entity/entity.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { EntityReference } from '../../common/entity/entity-reference.js';
import { MovePlayerToMap } from '../../common/messages.js';
import { EntityMenu } from '../canvas/mode/entity-menu.js';

export class SidepanelTabMaps extends SidepanelTab {
    constructor() {
        super('Maps', true);
        
        this.tab.style.display = 'grid';
        this.tab.style.gridTemplateRows = 'auto max-content max-content';
        
        const treePanel = document.createElement('div');
        treePanel.style.overflow = 'auto';
        this.tab.appendChild(treePanel);
        this.tree = new SearchableIDTree(treePanel, 'sidepanel-tab-maps', getValueProvider('map'), () => this.doOpenMap(), (id, x, y) => this.doOpenMenu(x, y));
        EntityManagers.get('map').addListener(() => this.tree.reload());
        
        if(ServerData.isGM()) {
            const buttonPanel = document.createElement('div');
            this.tab.appendChild(buttonPanel);
            GuiUtils.createButton(buttonPanel, 'New Map', () => this.doNewMap()).className = 'sidepanel-button';
        }
    }
    
    doOpenMap() {
        const map = EntityManagers.get('map').find(this.tree.getSelectedValue());
        if(map) MessageService.send(new MovePlayerToMap(map, ServerData.localProfile));
    }

    doOpenMenu(x, y) {
        const map = EntityManagers.get('map').find(this.tree.getSelectedValue());
        if(map) new EntityMenu(null, new EntityReference(map), ServerData.isGM(), x, y);
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
}
