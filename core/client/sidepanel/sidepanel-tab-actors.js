// @ts-check
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

export class SidepanelTabActors extends SidepanelTab {
    constructor() {
        super('actors', true);

        this.tab.style.display = 'grid';
        this.tab.style.gridTemplateRows = 'auto max-content max-content';

        const treePanel = document.createElement('div');
        treePanel.style.overflow = 'auto';
        this.tab.appendChild(treePanel);
        this.tree = new SearchableIDTree(treePanel, 'sidepanel-tab-actors', getValueProvider('actor'), () => this.doOpen(), (id, x, y) => this.doOpenMenu(x, y));
        Events.on('any_actor', event => this.tree.reload());

        if (ServerData.isGM()) {
            const buttonPanel = document.createElement('div');
            this.tab.appendChild(buttonPanel);
            GuiUtils.createButton(buttonPanel, I18N.get('sidepanel.actors.new.button', 'New Actor'), () => this.doAdd()).className = 'sidepanel-button';
        }
    }

    doOpen() {
        const actor = EntityManagers.get('actor').find(this.tree.getSelectedValue());
        if (actor) Events.trigger('openEntity', { entity: actor }, true);
    }

    doOpenMenu(x, y) {
        const actor = EntityManagers.get('actor').find(this.tree.getSelectedValue());
        if (actor) new EntityMenu(null, new EntityReference(actor), ServerData.isGM(), x, y);
    }

    doAdd() {
        new CanvasWindowInput(null, I18N.get('sidepanel.actors.new.title', 'New Actor'), I18N.get('sidepanel.actors.new.prompt', 'Enter Actor Name:'), '', name => {
            if (name) {
                const actor = new Entity('actor');
                actor.setString('name', name);
                EntityManagers.get('actor').add(actor);
            }
        });
    }
}
