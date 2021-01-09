import { SidepanelTab } from './sidepanel-tab.js';
import { SearchableIDTree } from '../gui/searchable-id-tree.js';
import { getValueProvider } from '../gui/value-providers.js';
import { CanvasWindowColorInput } from '../canvas/window/canvas-window-color-input.js';
import { GuiUtils } from '../util/guiutil.js';
import { ServerData } from '../server-data.js';
import { MessageService } from '../service/message-service.js';

import { SetPlayerColor } from '../../common/messages.js';

export class SidepanelTabPlayers extends SidepanelTab {
    constructor() {
        super('Players', true);
        
        this.tab.style.display = 'grid';
        this.tab.style.gridTemplateRows = 'auto max-content';
        
        var treePanel = document.createElement('div');
        treePanel.style.overflow = 'auto';
        this.tab.appendChild(treePanel);
        this.tree = new SearchableIDTree(treePanel, 'sidepanel-tab-players', getValueProvider('profile'));
        ServerData.profiles.addObserver(() => this.tree.reload());
        
        var buttonPanel1 = document.createElement('div');
        this.tab.appendChild(buttonPanel1);
        GuiUtils.createButton(buttonPanel1, 'Change Color', () => this.doChangeColor());
    }
    
    doChangeColor() {
        new CanvasWindowColorInput('Select Player Color', '#' + (ServerData.localProfile.getColor() & 0x00FFFFFF).toString(16).padStart(6, '0'), color => { 
            if(color != null && color != undefined) { 
                const msg = new SetPlayerColor(parseInt(color.substring(1), 16));
                MessageService.send(msg);
            }
        });
    }
}
