import { I18N } from '../../../common/util/i18n.js';
import { Tabs } from '../../gui/tabs.js';
import { Settings } from '../../settings/settings.js';
import { CanvasWindow } from '../canvas-window.js';

export class CanvasWindowSettings extends CanvasWindow {
    constructor() {
        super(I18N.get('settings.title', 'Settings'), false);

        this.initTabs();
        this.setDimensions(640, 700);
        this.center();
    }

    initTabs() {
        // create container
        const container = this.content;
        
        // create tabs
        var id = 0;
        for(const page of Settings.pages) {
            // create tab panel
            const panel = document.createElement('div');
            panel.name = I18N.get('settings.page.'+page.internalName, page.displayName);
            panel.className = 'edit-window-area'; //TODO: generalize this css class + move the code below to css
            panel.style.width = 'auto';
            panel.style.height = 'auto';
            panel.style.display = 'grid';
            panel.style.gridTemplateColumns = 'auto auto';
            panel.style.gridGap = '5px';
            panel.style.padding = '5px';
            container.appendChild(panel);

            // create entries
            for(const entry of page.entries) {
                panel.appendChild(entry.createName());
                panel.appendChild(entry.createEditor());
            }

            id++;
        }
        Tabs.init(container);
    }
}
