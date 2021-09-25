import { SidepanelTab } from './sidepanel-tab.js';
import { SearchableIDTree } from '../gui/searchable-id-tree.js';
import { getValueProvider } from '../gui/value-providers.js';
import { CanvasWindowInput } from '../canvas/window/canvas-window-input.js';
import { GuiUtils } from '../util/guiutil.js';
import { ServerData } from '../server-data.js';

import { Entity } from '../../common/entity/entity.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { EntityReference } from '../../common/entity/entity-reference.js';
import { EntityMenu } from '../canvas/mode/entity-menu.js';
import { I18N } from '../../common/util/i18n.js';
import { Events } from '../../common/events.js';

export class SidepanelTabCompendium extends SidepanelTab {
    constructor() {
        super('compendium', true, '📓');
        
        this.tab.style.display = 'grid';
        this.tab.style.gridTemplateRows = 'auto max-content max-content';
        
        const treePanel = document.createElement('div');
        treePanel.style.overflow = 'auto';
        this.tab.appendChild(treePanel);
        this.tree = new SearchableIDTree(treePanel, 'sidepanel-tab-compendium', getValueProvider('compendium'), () => this.doOpen(), (id, x, y) => this.doOpenMenu(x, y));
        EntityManagers.get('compendium').addListener(() => this.tree.reload());
        
        if(ServerData.isGM()) {
            const buttonPanel = document.createElement('div');
            this.tab.appendChild(buttonPanel);
            GuiUtils.createButton(buttonPanel, I18N.get('sidepanel.compendium.new.button', 'New Compendium Entry'), () => this.doAdd()).className = 'sidepanel-button';
        }
    }
    
    doOpen() {
        const compendium = EntityManagers.get('compendium').find(this.tree.getSelectedValue());
        if(compendium) Events.trigger('openEntity', { entity: compendium }, true);
    }

    doOpenMenu(x, y) {
        const compendium = EntityManagers.get('compendium').find(this.tree.getSelectedValue());
        if(compendium) new EntityMenu(null, new EntityReference(compendium), ServerData.isGM(), x, y);
    }
    
    doAdd() {
        new CanvasWindowInput(null, I18N.get('sidepanel.compendium.new.title', 'New Compendium Entry'), I18N.get('sidepanel.compendium.new.prompt', 'Enter Compendium Entry Name:'), '', name => {
            if(name) {
                const compendium = new Entity('compendium');
                compendium.setString('name', name);
                EntityManagers.get('compendium').add(compendium);
            }
        });
    }
}
