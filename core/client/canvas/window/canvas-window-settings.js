import { Settings } from '../../settings/settings.js';
import { CanvasWindow } from '../canvas-window.js';

export class CanvasWindowSettings extends CanvasWindow {
    constructor() {
        super('Settings', false);

        this.initTabs();
        this.setLocation({ position: { my: 'center', at: 'center' }, width: 640, height: 700 });
    }

    initTabs() {
        // create container
        const container = this.frame;
        const links = document.createElement('ul');
        container.appendChild(links);
        container.style.padding = '0em 0em';
        
        // create tabs
        var id = 0;
        for(const page of Settings.pages) {
            // create link
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#sptab-'+id;
            a.innerHTML = page.displayName;
            li.appendChild(a);
            links.appendChild(li);
            
            // create tab panel
            const panel = document.createElement('div');
            panel.id = 'sptab-'+id;
            panel.style.width = 'auto';
            panel.style.height = 'auto';
            panel.style.display = 'grid';
            panel.style.gridTemplateColumns = 'auto auto';
            panel.style.gridGap = '5px';
            container.appendChild(panel);

            // create entries
            for(const entry of page.entries) {
                panel.appendChild(entry.createName());
                panel.appendChild(entry.createEditor());
            }

            id++;
        }
        
        // convert to jquery-ui tabs
        $(container).tabs({
            heightStyle: 'content'
        });
    }
}
