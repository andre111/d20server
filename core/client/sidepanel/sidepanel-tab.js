import { ServerData } from '../server-data.js';

export class SidepanelTab {
    name;
    visible;
    tab;

    constructor(name, visible) {
        this.name = name;
        this.visible = visible;

        this.tab = document.createElement('div');
        // TODO: make this use a class and css
        this.tab.style.height = '100%';
        this.tab.style.padding = '4px'; 
        this.tab.style.overflow = 'auto';
    }

    getName() {
        return this.name;
    }

    isVisible() {
        return this.visible;
    }

    getTab() {
        return this.tab;
    }
}
