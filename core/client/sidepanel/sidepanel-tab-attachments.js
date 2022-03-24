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

export class SidepanelTabAttachments extends SidepanelTab {
    constructor() {
        super('attachments', true);

        this.tab.style.display = 'grid';
        this.tab.style.gridTemplateRows = 'auto max-content max-content';

        const treePanel = document.createElement('div');
        treePanel.style.overflow = 'auto';
        this.tab.appendChild(treePanel);
        this.tree = new SearchableIDTree(treePanel, 'sidepanel-tab-attachments', getValueProvider('attachment'), () => this.doOpen(), (id, x, y) => this.doOpenMenu(x, y));
        Events.on('any_attachment', event => this.tree.reload());

        if (ServerData.isGM()) {
            const buttonPanel = document.createElement('div');
            this.tab.appendChild(buttonPanel);
            GuiUtils.createButton(buttonPanel, I18N.get('sidepanel.attachments.new.button', 'New Attachment'), () => this.doAdd()).className = 'sidepanel-button';
        }
    }

    doOpen() {
        const attachment = EntityManagers.get('attachment').find(this.tree.getSelectedValue());
        if (attachment) Events.trigger('openEntity', { entity: attachment }, true);
    }

    doOpenMenu(x, y) {
        const attachment = EntityManagers.get('attachment').find(this.tree.getSelectedValue());
        if (attachment) new EntityMenu(null, new EntityReference(attachment), ServerData.isGM(), x, y);
    }

    doAdd() {
        new CanvasWindowInput(null, I18N.get('sidepanel.attachments.new.title', 'New Attachment'), I18N.get('sidepanel.attachments.new.prompt', 'Enter Attachment Name:'), '', name => {
            if (name) {
                const attachment = new Entity('attachment');
                attachment.setString('name', name);
                EntityManagers.get('attachment').add(attachment);
            }
        });
    }
}
